package com.rideflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiAssistantRequest {

    @NotBlank(message = "Prompt is required")
    private String prompt;

    private Long rideId;
}
