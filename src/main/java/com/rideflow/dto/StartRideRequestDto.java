package com.rideflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartRideRequestDto {

    @NotBlank(message = "OTP is required")
    private String otp;
}
