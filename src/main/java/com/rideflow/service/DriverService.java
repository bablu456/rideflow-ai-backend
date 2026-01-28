package com.rideflow.service;

import com.rideflow.entity.Driver;

import java.util.List;

public interface DriverService {
    Driver registerDriver(Driver driver);
    Driver updateAvailability(Long driverId, boolean available);
    List<Driver> findAvailableDrivers();
}
