package com.rideflow.dto;

import com.rideflow.entity.PaymentMethod;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletAddResponse {

    private Double addedAmount;
    private PaymentMethod paymentMethod;
    private Double walletBalance;
    private String message;
}
