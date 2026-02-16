package com.rideflow.service;

import com.rideflow.dto.DriverNearbyDto;
import com.rideflow.dto.DriverProfileStatsResponse;
import com.rideflow.dto.DriverProfileUpdateRequest;
import com.rideflow.entity.Driver;

import java.util.List;

public interface DriverService {
    Driver registerDriver(Driver driver);
    Driver updateAvailability(Long driverId, boolean available);
    Driver updateCurrentLocation(Long driverId, Double latitude, Double longitude);
    List<Driver> findAvailableDrivers();
    Driver getDriverByUserEmail(String email);
    List<DriverNearbyDto> findNearbyDrivers(Double pickupLat, Double pickupLon, Double radiusKm);
    DriverProfileStatsResponse getDriverProfileStats(String email);
    DriverProfileStatsResponse updateDriverProfile(String email, DriverProfileUpdateRequest request);
}
