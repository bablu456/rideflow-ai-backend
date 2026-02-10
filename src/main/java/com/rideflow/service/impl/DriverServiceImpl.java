package com.rideflow.service.impl;

import com.rideflow.entity.Driver;
import com.rideflow.entity.User;
import com.rideflow.exception.ResourceNotFoundException;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

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
    public List<Driver> findAvailableDrivers() {
        return driverRepository.findByIsAvailableTrue();
    }

    @Override
    public Driver getDriverByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "userId", user.getId()));
    }
}
