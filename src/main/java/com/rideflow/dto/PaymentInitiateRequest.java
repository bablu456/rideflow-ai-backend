package com.rideflow.dto;

import com.rideflow.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentInitiateRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
}
