package com.rideflow.service.impl;

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
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
@Service
@RequiredArgsConstructor
public class RideServiceImpl implements RiderService{

    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public RideDto requestRide(RideRequestDto request){
        User passenger = userRepository.findById(request.getPassengerId())
                .orElseThrow(() -> new RuntimeException("Passenger not found"));

        List<Driver>  availableDrivers = driverRepository.findByAvailableTrue();

        if(availableDrivers.isEmpty()){
            throw new RuntimeException("No Drivers Availbale nearby");
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
        ride.setFare(calculateFare());

        Ride savedRide = rideRepository.save(ride);

        matchedDriver.setAvailable(false);
        driverRepository.save(matchedDriver);

        return mapToDto(savedRide);
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

    private Double calculateFare(){
        return 150.0;
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
