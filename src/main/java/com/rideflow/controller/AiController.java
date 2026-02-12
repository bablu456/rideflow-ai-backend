package com.rideflow.controller;

import com.rideflow.dto.AiAssistantRequest;
import com.rideflow.dto.AiAssistantResponse;
import com.rideflow.service.AiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/assistant")
    public ResponseEntity<AiAssistantResponse> askAssistant(@RequestBody @Valid AiAssistantRequest request) {
        return ResponseEntity.ok(aiAssistantService.getAssistantResponse(request));
    }
}
