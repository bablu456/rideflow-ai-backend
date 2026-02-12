package com.rideflow.service;

import com.rideflow.dto.AiAssistantRequest;
import com.rideflow.dto.AiAssistantResponse;

public interface AiAssistantService {

    AiAssistantResponse getAssistantResponse(AiAssistantRequest request);
}
