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
    private String riderName;
    private String pickupArea;
    private String dropArea;
    private String driverName;
    private String vehiclePlateNumber;
    private String driverPhone;
    private Double driverRating;
    private LocalDateTime createdAt;
}
