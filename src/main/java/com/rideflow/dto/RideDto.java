package com.rideflow.dto;

import com.rideflow.entity.RideStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RideDto {
    private Long id;
    private RideStatus status;
    private Double fare;
    private String driverName;
    private String vehicleNumber;
    private LocalDateTime createdTime;
}
