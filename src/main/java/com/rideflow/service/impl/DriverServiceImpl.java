package com.rideflow.service.impl;

import com.rideflow.dto.DriverNearbyDto;
import com.rideflow.dto.DriverProfileStatsResponse;
import com.rideflow.dto.DriverProfileUpdateRequest;
import com.rideflow.entity.Driver;
import com.rideflow.entity.RideStatus;
import com.rideflow.entity.User;
import com.rideflow.exception.ResourceNotFoundException;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.RideRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.service.DriverService;
import com.rideflow.utils.DistanceCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private static final double DEFAULT_RADIUS_KM = 5.0;
    private static final double EXPANDED_RADIUS_KM = 10.0;
    private static final double RATING_PRIORITY_DISTANCE_KM = 0.5;

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final DistanceCalculator distanceCalculator;

    @Override
    public Driver registerDriver(Driver driver) {
        return driverRepository.save(driver);
    }

    @Override
    public Driver updateAvailability(Long driverId, boolean available) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        driver.setIsAvailable(available);
        return driverRepository.save(driver);
    }

    @Override
    public Driver updateCurrentLocation(Long driverId, Double latitude, Double longitude) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        driver.setCurrentLatitude(latitude);
        driver.setCurrentLongitude(longitude);
        return driverRepository.save(driver);
    }

    @Override
    public List<Driver> findAvailableDrivers() {
        return driverRepository.findByIsAvailableTrue();
    }

    @Override
    public Driver getDriverByUserEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", user.getId()));
    }

    @Override
    public List<DriverNearbyDto> findNearbyDrivers(Double pickupLat, Double pickupLon, Double radiusKm) {
        validateCoordinates(pickupLat, pickupLon);

        double effectiveRadius = (radiusKm == null || radiusKm <= 0) ? DEFAULT_RADIUS_KM : radiusKm;
        List<Driver> drivers = driverRepository.findAvailableDriversWithinRadius(pickupLat, pickupLon, effectiveRadius);

        if (drivers.isEmpty() && effectiveRadius < EXPANDED_RADIUS_KM) {
            drivers = driverRepository.findAvailableDriversWithinRadius(pickupLat, pickupLon, EXPANDED_RADIUS_KM);
        }

        // Final fallback: return all online drivers and rank by distance/rating.
        if (drivers.isEmpty()) {
            drivers = driverRepository.findByIsAvailableTrue();
        }

        return drivers.stream()
                .filter(driver -> driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null)
                .map(driver -> NearbyDriverCandidate.from(driver, distanceCalculator.calculateDistance(
                        pickupLat,
                        pickupLon,
                        driver.getCurrentLatitude(),
                        driver.getCurrentLongitude())))
                .sorted(this::compareNearbyCandidates)
                .map(this::toNearbyDto)
                .toList();
    }

    @Override
    public DriverProfileStatsResponse getDriverProfileStats(String email) {
        Driver driver = getDriverByUserEmail(email);
        return buildDriverProfileStats(driver);
    }

    @Override
    public DriverProfileStatsResponse updateDriverProfile(String email, DriverProfileUpdateRequest request) {
        Driver driver = getDriverByUserEmail(email);
        User user = driver.getUser();

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getProfilePicture() != null && !request.getProfilePicture().isBlank()) {
            user.setProfilePicture(request.getProfilePicture().trim());
        }

        userRepository.save(user);
        return buildDriverProfileStats(driver);
    }

    private DriverProfileStatsResponse buildDriverProfileStats(Driver driver) {
        Long completedRides = rideRepository.countByDriverIdAndStatus(driver.getId(), RideStatus.COMPLETED);
        Long cancelledRides = rideRepository.countByDriverIdAndStatus(driver.getId(), RideStatus.CANCELLED);
        Double totalEarnings = rideRepository.sumFareByDriverIdAndStatus(driver.getId(), RideStatus.COMPLETED);

        User user = driver.getUser();
        return DriverProfileStatsResponse.builder()
                .driverId(driver.getId())
                .userId(user != null ? user.getId() : null)
                .name(user != null ? user.getName() : null)
                .email(user != null ? user.getEmail() : null)
                .phone(user != null ? user.getPhone() : null)
                .profilePicture(user != null ? user.getProfilePicture() : null)
                .available(driver.getIsAvailable())
                .vehicleType(driver.getVehicleType())
                .vehiclePlateNumber(driver.getVehiclePlateNumber())
                .rating(driver.getRating())
                .currentLatitude(driver.getCurrentLatitude())
                .currentLongitude(driver.getCurrentLongitude())
                .completedRides(completedRides == null ? 0L : completedRides)
                .cancelledRides(cancelledRides == null ? 0L : cancelledRides)
                .totalEarnings(totalEarnings == null ? 0.0 : Math.round(totalEarnings * 100.0) / 100.0)
                .build();
    }

    private DriverNearbyDto toNearbyDto(NearbyDriverCandidate candidate) {
        Driver driver = candidate.driver();
        User user = driver.getUser();

        return DriverNearbyDto.builder()
                .driverId(driver.getId())
                .driverName(user != null ? user.getName() : "Driver")
                .vehicleType(driver.getVehicleType())
                .vehiclePlateNumber(driver.getVehiclePlateNumber())
                .rating(candidate.rating())
                .distanceKm(Math.round(candidate.distanceKm() * 100.0) / 100.0)
                .latitude(driver.getCurrentLatitude())
                .longitude(driver.getCurrentLongitude())
                .build();
    }

    private int compareNearbyCandidates(NearbyDriverCandidate left, NearbyDriverCandidate right) {
        double distanceGap = Math.abs(left.distanceKm() - right.distanceKm());
        if (distanceGap < RATING_PRIORITY_DISTANCE_KM) {
            int ratingCompare = Double.compare(right.rating(), left.rating());
            if (ratingCompare != 0) {
                return ratingCompare;
            }
        }

        return Comparator.comparingDouble(NearbyDriverCandidate::distanceKm)
                .thenComparing(Comparator.comparingDouble(NearbyDriverCandidate::rating).reversed())
                .compare(left, right);
    }

    private void validateCoordinates(Double pickupLat, Double pickupLon) {
        if (pickupLat == null || pickupLon == null) {
            throw new RuntimeException("Pickup coordinates are required");
        }
    }

    private record NearbyDriverCandidate(Driver driver, double distanceKm, double rating) {
        private static NearbyDriverCandidate from(Driver driver, double distanceKm) {
            double rating = driver.getRating() == null ? 0.0 : driver.getRating();
            return new NearbyDriverCandidate(driver, distanceKm, rating);
        }
    }
}
