package com.rideflow.service.impl;

import com.rideflow.dto.FareDto;
import com.rideflow.dto.RideDto;
import com.rideflow.dto.RideRequestDto;
import com.rideflow.entity.Driver;
import com.rideflow.entity.Ride;
import com.rideflow.entity.RideStatus;
import com.rideflow.entity.User;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.RideRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.service.RiderService;
import com.rideflow.utils.DistanceCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class RideServiceImpl implements RiderService{

    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final DistanceCalculator distanceCalculator;

    @Override
    @Transactional
    public RideDto requestRide(RideRequestDto request){
        User passenger = userRepository.findById(request.getPassengerId())
                .orElseThrow(() -> new RuntimeException("Passenger not found"));

        List<Driver>  availableDrivers = driverRepository.findByAvailableTrue();

        if(availableDrivers.isEmpty()){
            throw new RuntimeException("No Drivers Available nearby!");
        }

        Driver matchedDriver = availableDrivers.get(0);

        Ride ride = new Ride();
        ride.setRider(passenger);
        ride.setDriver(matchedDriver);
        ride.setPickupLatitude(request.getPickupLatitude());
        ride.setPickupLongitude(request.getPickupLongitude());
        ride.setDropLatitude(request.getDropLatitude());
        ride.setDropLongitude(request.getDropLongitude());
        ride.setStatus(RideStatus.REQUESTED);
        ride.setOtp(generateOTP());

        Double distance = distanceCalculator.calculateDistance(
                request.getPickupLatitude(),
                request.getPickupLongitude(),
                request.getDropLatitude(),
                request.getPickupLongitude()
        );

        ride.setFare(calculateFare(distance, request.getVehichleType()));

        System.out.println("DEV LOG-OTP for Ride: "+ride.getOtp());

        Ride savedRide = rideRepository.save(ride);

        matchedDriver.setAvailable(false);
        driverRepository.save(matchedDriver);

        return mapToDto(savedRide);
    }

    public FareDto calculateRideFares(Double pickupLat, Double pickupLong, Double dropLat, Double dropLong){
        Double distance = distanceCalculator.calculateDistance(pickupLat,pickupLong,dropLat,dropLong);

        double baseFare = 30.0;

        double bikeRate = 8.0;
        double autoRate = 12.0;
        double carRate = 18.0;
        double premierRate = 25.0;

        return FareDto.builder()
                .distanceKm(Math.round(distance * 10.0) / 10.0) // 5.4 km
                .bikeFare(Math.round((baseFare + (distance * bikeRate)) * 100.0) / 100.0)
                .autoFare(Math.round((baseFare + (distance * autoRate)) * 100.0) / 100.0)
                .carFare(Math.round((baseFare + (distance * carRate)) * 100.0) / 100.0)
                .premierFare(Math.round((baseFare + (distance * premierRate)) * 100.0) / 100.0)
                .build();
    }

    @Override
    public RideDto getRideStatus(Long rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        return mapToDto(ride);
    }

    @Override
    @Transactional
    public RideDto acceptRide(Long rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() ->new RuntimeException("Ride not found"));
        if(ride.getStatus() != RideStatus.REQUESTED){
            throw new RuntimeException("Ride already Processed ");
        }
        ride.setStatus(RideStatus.CONFIRMED);
        return mapToDto(rideRepository.save(ride));
    }

    @Override
    @Transactional
    public RideDto completeRide(Long rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found "));
        ride.setStatus(RideStatus.COMPLETED);
        ride.setEndTime(LocalDateTime.now());

        Driver driver = ride.getDriver();
        driver.setAvailable(true);
        driverRepository.save(driver);

        return mapToDto(rideRepository.save(ride));
    }

    @Override
    @Transactional
    public RideDto startRide(Long rideId, String otp){
        Ride ride = rideRepository.findById(rideId).orElseThrow(() -> new RuntimeException("Ride not found"));

        if(!ride.getOtp().equals(otp)){
            throw new RuntimeException("Invalid Otp ");
        }
        ride.setStatus(RideStatus.ONGOING);
        ride.setStartTime(LocalDateTime.now());
        return mapToDto(rideRepository.save(ride));
    }

    public RideDto cancelRide(Long rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found "));

        ride.setStatus(RideStatus.CANCELLED);

        Driver driver = ride.getDriver();
        driver.setAvailable(true);
        driverRepository.save(driver);

        return mapToDto(rideRepository.save(ride));
    }

    private Double calculateFare(double distance, String vehicleType){
        double baseFare = 30.0;
        double ratePerkm;

        switch (vehicleType.toUpperCase()){
            case "BIKE":
                ratePerkm = 8.0;
                break;
            case "AUTO":
                ratePerkm = 12.0;
                break;
            case "CAR":
            default:
                ratePerkm=18.0;
                break;
        }
        double totalFare = baseFare + (distance * ratePerkm);
        return Math.round(totalFare * 100.0) / 100.0;

    }

    private String generateOTP(){
        return String.format("%04d", new Random().nextInt(10000));
    }

    private RideDto mapToDto(Ride ride){
        RideDto dto  = new RideDto();
        dto.setId(ride.getId());
        dto.setStatus(ride.getStatus());
        dto.setFare(ride.getFare());
        dto.setCreatedTime(ride.getCreatedTime());
        if(ride.getDriver() != null){
            dto.setDriverName(ride.getDriver().getUser().getName());
            dto.setVehicleNumber(ride.getDriver().getLicenseNumber());
        }
        return dto;
    }
}
