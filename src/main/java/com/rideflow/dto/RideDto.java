package com.rideflow.dto;

import com.rideflow.entity.RideStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RideDto {
    private Long id;
    private RideStatus status;
    private Double fare;
    private Double distanceKm;
    private String otp;
    private String driverName;
    private String vehiclePlateNumber;
    private LocalDateTime createdAt;
}
