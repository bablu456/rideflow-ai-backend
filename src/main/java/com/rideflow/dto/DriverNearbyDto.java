package com.rideflow.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DriverNearbyDto {

    private Long driverId;
    private String driverName;
    private String vehicleType;
    private String vehiclePlateNumber;
    private Double rating;
    private Double distanceKm;
    private Double latitude;
    private Double longitude;
}
