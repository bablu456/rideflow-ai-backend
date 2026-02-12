package com.rideflow.service;

import com.rideflow.dto.PaymentDto;
import com.rideflow.dto.PaymentInitiateRequest;

public interface PaymentService {

    PaymentDto initiatePayment(Long rideId, PaymentInitiateRequest request);

    PaymentDto completePayment(String transactionId);

    PaymentDto getPaymentByRideId(Long rideId);

    PaymentDto getPaymentByTransactionId(String transactionId);
}
