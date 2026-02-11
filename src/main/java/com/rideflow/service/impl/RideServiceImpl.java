package com.rideflow.service.impl;

import com.rideflow.dto.FareDto;
import com.rideflow.dto.RideDto;
import com.rideflow.dto.RideRequestDto;
import com.rideflow.entity.*;
import com.rideflow.exception.ResourceNotFoundException;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.RideRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.service.RiderService;
import com.rideflow.utils.DistanceCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class RideServiceImpl implements RiderService {

    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final DistanceCalculator distanceCalculator;

    @Override
    @Transactional
    public RideDto requestRide(RideRequestDto request) {
        User passenger;
        if (request.getPassengerId() != null) {
            passenger = userRepository.findById(request.getPassengerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getPassengerId()));
        } else {
            passenger = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No users exist in the system"));
        }

        List<Driver> availableDrivers = driverRepository.findByIsAvailableTrue();

        if (availableDrivers.isEmpty()) {
            throw new RuntimeException("No Drivers Available nearby!");
        }

        if (availableDrivers.isEmpty()) {
            throw new RuntimeException("No Drivers Available nearby!");
        }

        // Driver matchedDriver = availableDrivers.get(0); // REMOVED: Driver will be
        // assigned when they accept

        Location pickupLocation = Location.builder()
                .latitude(request.getPickupLatitude())
                .longitude(request.getPickupLongitude())
                .address(request.getPickupArea())
                .build();

        Location dropLocation = Location.builder()
                .latitude(request.getDropLatitude())
                .longitude(request.getDropLongitude())
                .address(request.getDropArea())
                .build();

        Double distance = distanceCalculator.calculateDistance(
                request.getPickupLatitude(),
                request.getPickupLongitude(),
                request.getDropLatitude(),
                request.getDropLongitude());

        Ride ride = new Ride();
        ride.setRider(passenger);
        ride.setRider(passenger);
        // ride.setDriver(matchedDriver); // REMOVED: Driver assigned on accept
        ride.setPickupLocation(pickupLocation);
        ride.setDropLocation(dropLocation);
        ride.setStatus(RideStatus.REQUESTED);
        ride.setOtp(generateOTP());
        ride.setDistanceKm(Math.round(distance * 10.0) / 10.0);
        ride.setFare(calculateFare(distance, request.getVehicleType()));

        Ride savedRide = rideRepository.save(ride);

        // matchedDriver.setIsAvailable(false); // REMOVED: Availability changes on
        // accept/start
        // driverRepository.save(matchedDriver);

        return mapToDto(savedRide);
    }

    @Override
    public FareDto calculateRideFares(Double pickupLat, Double pickupLong, Double dropLat, Double dropLong) {
        Double distance = distanceCalculator.calculateDistance(pickupLat, pickupLong, dropLat, dropLong);

        double baseFare = 30.0;
        double bikeRate = 8.0;
        double autoRate = 12.0;
        double carRate = 18.0;
        double premierRate = 25.0;

        return FareDto.builder()
                .distanceKm(Math.round(distance * 10.0) / 10.0)
                .bikeFare(Math.round((baseFare + (distance * bikeRate)) * 100.0) / 100.0)
                .autoFare(Math.round((baseFare + (distance * autoRate)) * 100.0) / 100.0)
                .carFare(Math.round((baseFare + (distance * carRate)) * 100.0) / 100.0)
                .premierFare(Math.round((baseFare + (distance * premierRate)) * 100.0) / 100.0)
                .build();
    }

    @Override
    public RideDto getRideStatus(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride", "id", rideId));
        return mapToDto(ride);
    }

    @Override
    @Transactional
    public RideDto acceptRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride", "id", rideId));

        if (ride.getStatus() != RideStatus.REQUESTED) {
            throw new RuntimeException("Ride already processed or accepted by another driver");
        }

        // Get current authenticated driver
        User currentUser = (User) org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        Driver driver = driverRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Driver profile not found for user: " + currentUser.getId()));

        if (!driver.getIsAvailable()) {
            throw new RuntimeException("You are not marked as available.");
        }

        ride.setDriver(driver);
        ride.setStatus(RideStatus.ACCEPTED);

        driver.setIsAvailable(false); // Driver is now busy
        driverRepository.save(driver);

        return mapToDto(rideRepository.save(ride));
    }

    @Override
    @Transactional
    public RideDto startRide(Long rideId, String otp) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride", "id", rideId));

        if (ride.getStatus() != RideStatus.ACCEPTED) {
            throw new RuntimeException("Ride is not accepted yet");
        }

        String normalizedOtp = otp == null ? "" : otp.trim();
        if (!ride.getOtp().equals(normalizedOtp)) {
            throw new RuntimeException("Invalid OTP");
        }

        ride.setStatus(RideStatus.STARTED);
        ride.setStartedAt(LocalDateTime.now());
        return mapToDto(rideRepository.save(ride));
    }

    @Override
    @Transactional
    public RideDto completeRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride", "id", rideId));

        ride.setStatus(RideStatus.COMPLETED);
        ride.setEndedAt(LocalDateTime.now());

        Driver driver = ride.getDriver();
        driver.setIsAvailable(true);
        driverRepository.save(driver);

        return mapToDto(rideRepository.save(ride));
    }

    @Override
    @Transactional
    public RideDto cancelRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride", "id", rideId));

        if (ride.getStatus() == RideStatus.COMPLETED || ride.getStatus() == RideStatus.CANCELLED) {
            throw new RuntimeException("Ride is already closed.");
        }

        ride.setStatus(RideStatus.CANCELLED);
        ride.setEndedAt(LocalDateTime.now());

        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            driver.setIsAvailable(true);
            driverRepository.save(driver);
        }

        return mapToDto(rideRepository.save(ride));
    }

    @Override
    public List<RideDto> getAvailableRides() {
        return rideRepository.findByStatusOrderByCreatedAtDesc(RideStatus.REQUESTED).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RideDto> getRidesForDriver(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        return rideRepository.findByDriver(driver).stream()
                .sorted(Comparator.comparing(Ride::getCreatedAt).reversed())
                .map(this::mapToDto)
                .toList();
    }

    private Double calculateFare(double distance, String vehicleType) {
        double baseFare = 30.0;
        double ratePerKm;

        switch (vehicleType.toUpperCase()) {
            case "BIKE":
                ratePerKm = 8.0;
                break;
            case "AUTO":
                ratePerKm = 12.0;
                break;
            case "CAR":
            default:
                ratePerKm = 18.0;
                break;
        }

        double totalFare = baseFare + (distance * ratePerKm);
        return Math.round(totalFare * 100.0) / 100.0;
    }

    private String generateOTP() {
        return String.format("%04d", new Random().nextInt(10000));
    }

    private RideDto mapToDto(Ride ride) {
        RideDto dto = new RideDto();
        dto.setId(ride.getId());
        dto.setStatus(ride.getStatus());
        dto.setFare(ride.getFare());
        dto.setDistanceKm(ride.getDistanceKm());
        dto.setOtp(ride.getOtp());
        dto.setPickupArea(ride.getPickupLocation() != null ? ride.getPickupLocation().getAddress() : "");
        dto.setDropArea(ride.getDropLocation() != null ? ride.getDropLocation().getAddress() : "");
        dto.setCreatedAt(ride.getCreatedAt());
        if (ride.getRider() != null) {
            dto.setRiderName(ride.getRider().getName());
        }
        if (ride.getDriver() != null) {
            dto.setDriverName(ride.getDriver().getUser().getName());
            dto.setVehiclePlateNumber(ride.getDriver().getVehiclePlateNumber());
            dto.setDriverPhone(ride.getDriver().getUser().getPhone());
            dto.setDriverRating(ride.getDriver().getRating());
        }
        return dto;
    }
}
