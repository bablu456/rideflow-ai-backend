package com.rideflow.service.impl;

import com.rideflow.entity.Driver;
import com.rideflow.repository.DriverRepository;
import com.rideflow.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;

    @Override
    public Driver registerDriver(Driver driver){
        return driverRepository.save(driver);
    }

    @Override
    public Driver updateAvailability(Long driverId, boolean available){
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found "));
        driver.setAvailable(available);
        return driverRepository.save(driver);
    }

    @Override
    public List<Driver> findAvailableDrivers(){
        return driverRepository.findByAvailableTrue();
    }
}
