package com.rideflow.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.rideflow.dto.AiAssistantRequest;
import com.rideflow.dto.AiAssistantResponse;
import com.rideflow.entity.Ride;
import com.rideflow.repository.RideRepository;
import com.rideflow.service.AiAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AiAssistantServiceImpl implements AiAssistantService {

    private static final String FALLBACK_MODEL_NAME = "rule-based-assistant";

    private final RideRepository rideRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.openai.enabled:false}")
    private boolean openAiEnabled;

    @Value("${ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String openAiModel;

    @Override
    public AiAssistantResponse getAssistantResponse(AiAssistantRequest request) {
        String prompt = request.getPrompt().trim();
        String rideContext = buildRideContext(request.getRideId());

        if (openAiEnabled && openAiApiKey != null && !openAiApiKey.isBlank()) {
            String externalAnswer = getOpenAiResponse(prompt, rideContext);
            if (externalAnswer != null && !externalAnswer.isBlank()) {
                return AiAssistantResponse.builder()
                        .answer(externalAnswer)
                        .usedExternalModel(true)
                        .model(openAiModel)
                        .build();
            }
        }

        return AiAssistantResponse.builder()
                .answer(buildFallbackResponse(prompt, rideContext))
                .usedExternalModel(false)
                .model(FALLBACK_MODEL_NAME)
                .build();
    }

    private String getOpenAiResponse(String prompt, String rideContext) {
        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("model", openAiModel);

            ArrayNode input = payload.putArray("input");

            ObjectNode systemMessage = input.addObject();
            systemMessage.put("role", "system");
            systemMessage.put("content",
                    "You are an assistant for RideFlow. Give practical, concise answers about rides, OTP login, payments, and account help.");

            ObjectNode userMessage = input.addObject();
            userMessage.put("role", "user");
            userMessage.put("content", buildUserPrompt(prompt, rideContext));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                System.err.println("OpenAI request failed: " + response.statusCode() + " " + response.body());
                return null;
            }

            return extractAssistantText(response.body());
        } catch (Exception ex) {
            System.err.println("OpenAI fallback triggered due to error: " + ex.getMessage());
            return null;
        }
    }

    private String extractAssistantText(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            if (root.hasNonNull("output_text")) {
                String outputText = root.get("output_text").asText("");
                if (!outputText.isBlank()) {
                    return outputText;
                }
            }

            JsonNode output = root.path("output");
            if (output.isArray()) {
                for (JsonNode item : output) {
                    JsonNode content = item.path("content");
                    if (!content.isArray()) {
                        continue;
                    }

                    for (JsonNode block : content) {
                        String text = block.path("text").asText("");
                        if (!text.isBlank()) {
                            return text;
                        }
                    }
                }
            }

            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    private String buildUserPrompt(String prompt, String rideContext) {
        if (rideContext.isBlank()) {
            return prompt;
        }

        return prompt + "\n\nRide context:\n" + rideContext;
    }

    private String buildRideContext(Long rideId) {
        if (rideId == null) {
            return "";
        }

        return rideRepository.findById(rideId)
                .map(this::mapRideContext)
                .orElse("");
    }

    private String mapRideContext(Ride ride) {
        String pickupArea = ride.getPickupLocation() != null ? ride.getPickupLocation().getAddress() : "unknown";
        String dropArea = ride.getDropLocation() != null ? ride.getDropLocation().getAddress() : "unknown";

        return "RideId=" + ride.getId() +
                ", status=" + ride.getStatus() +
                ", fare=" + ride.getFare() +
                ", distanceKm=" + ride.getDistanceKm() +
                ", pickup=" + pickupArea +
                ", drop=" + dropArea;
    }

    private String buildFallbackResponse(String prompt, String rideContext) {
        String normalized = prompt.toLowerCase();

        if (normalized.contains("fare") || normalized.contains("price") || normalized.contains("cost")) {
            return "Use /api/rides/calculate for fare estimation. Once a ride is completed, initiate payment via /api/payments/rides/{rideId}/initiate.";
        }

        if (normalized.contains("payment") || normalized.contains("pay")) {
            return "Payment flow: initiate payment for a completed ride, then complete using the transaction id. Check status from /api/payments/rides/{rideId}.";
        }

        if (normalized.contains("otp") || normalized.contains("login")) {
            return "For OTP login, request OTP from /api/auth/otp/send-login and verify with /api/auth/otp/login.";
        }

        if (normalized.contains("forgot") || normalized.contains("reset password")) {
            return "Forgot password flow: /api/auth/password/forgot to request OTP, then /api/auth/password/reset to set a new password.";
        }

        if (!rideContext.isBlank()) {
            return "Ride summary: " + rideContext + ". Ask me for fare, payment, or next-step guidance.";
        }

        return "I can help with ride flow, OTP login, password reset, and payment steps. Ask a specific question for exact guidance.";
    }
}
