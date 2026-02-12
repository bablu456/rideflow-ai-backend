package com.rideflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpSendRequest {

    @NotBlank(message = "Identifier is required")
    private String identifier;
}
