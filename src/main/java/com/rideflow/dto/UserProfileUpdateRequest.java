package com.rideflow.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {

    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @Size(max = 20, message = "Phone cannot exceed 20 characters")
    private String phone;

    @Size(max = 500, message = "Profile picture URL cannot exceed 500 characters")
    private String profilePicture;
}
