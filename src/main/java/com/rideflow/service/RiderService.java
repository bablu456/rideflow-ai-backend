package com.rideflow.service;

import com.rideflow.dto.RideDto;
import com.rideflow.dto.RideRequestDto;

public interface RiderService {

    RideDto requestRide(RideRequestDto rideRequestDto);
    RideDto getRideStatus(Long rideId);

    RideDto acceptRide(Long rideId);
    RideDto startRide(Long rideId, String otp);
    RideDto completeRide(Long rideId);
    RideDto cancelRide(Long rideId);



}
