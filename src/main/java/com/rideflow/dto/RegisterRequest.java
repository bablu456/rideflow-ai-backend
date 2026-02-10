package com.rideflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phone;

    // Role-based registration: RIDER or DRIVER
    private String role;

    // Driver profile fields (used when role = DRIVER)
    private String licenseNumber;
    private String vehicleType;
    private String vehiclePlateNumber;
    private Double currentLatitude;
    private Double currentLongitude;
    private Boolean available;
}
