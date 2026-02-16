package com.rideflow.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DriverProfileStatsResponse {

    private Long driverId;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String profilePicture;
    private Boolean available;
    private String vehicleType;
    private String vehiclePlateNumber;
    private Double rating;
    private Double currentLatitude;
    private Double currentLongitude;
    private Long completedRides;
    private Long cancelledRides;
    private Double totalEarnings;
}
