package com.rideflow.service;

import com.rideflow.dto.FareDto;
import com.rideflow.dto.RideDto;
import com.rideflow.dto.RideRequestDto;

import java.util.List;

public interface RiderService {

    RideDto requestRide(RideRequestDto rideRequestDto);

    RideDto getRideStatus(Long rideId);

    RideDto acceptRide(Long rideId);

    RideDto startRide(Long rideId, String otp);

    RideDto completeRide(Long rideId);

    RideDto cancelRide(Long rideId);

    FareDto calculateRideFares(Double pickupLat, Double pickupLong, Double dropLat, Double dropLong);

    List<RideDto> getRidesForDriver(Long driverId);

    List<RideDto> getAvailableRides();
}
