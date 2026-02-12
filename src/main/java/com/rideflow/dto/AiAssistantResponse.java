package com.rideflow.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiAssistantResponse {

    private String answer;
    private boolean usedExternalModel;
    private String model;
}
