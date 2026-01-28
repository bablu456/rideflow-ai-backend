package com.rideflow.dto;


import lombok.Data;

@Data
public class RideRequestDto {
    private Long passengerId;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double dropLongitude;
    private String vehichleType;
}
