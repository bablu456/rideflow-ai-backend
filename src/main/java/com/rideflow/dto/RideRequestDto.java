package com.rideflow.dto;


import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RideRequestDto {

    @NotNull(message = "Passenger ID is required ")
    private Long passengerId;

    @NotNull(message = "Pickup Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be valid")
    @DecimalMax(value = "90.0", message = "Latitude must be valid")
    private Double pickupLatitude;

    @NotNull(message = "Pickup Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be valid")
    @DecimalMax(value = "180.0", message = "Longitude must be valid")
    private Double pickupLongitude;


    private Double dropLatitude;

    @NotNull(message = "Drop Longitude is required")
    private Double dropLongitude;

    @NotBlank(message = "Vehicle type is required")
    private String vehichleType;
}
