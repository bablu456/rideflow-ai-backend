package com.rideflow.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DriverProfileUpdateRequest {

    @Size(max = 120, message = "Name must be at most 120 characters")
    private String name;

    @Size(max = 20, message = "Phone must be at most 20 characters")
    private String phone;

    @Size(max = 500, message = "Profile picture URL is too long")
    private String profilePicture;
}
