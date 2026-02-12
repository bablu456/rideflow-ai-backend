package com.rideflow.controller;

import com.rideflow.dto.PaymentDto;
import com.rideflow.dto.PaymentInitiateRequest;
import com.rideflow.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/rides/{rideId}/initiate")
    public ResponseEntity<PaymentDto> initiatePayment(
            @PathVariable Long rideId,
            @RequestBody @Valid PaymentInitiateRequest request) {
        return ResponseEntity.ok(paymentService.initiatePayment(rideId, request));
    }

    @PostMapping("/{transactionId}/complete")
    public ResponseEntity<PaymentDto> completePayment(@PathVariable String transactionId) {
        return ResponseEntity.ok(paymentService.completePayment(transactionId));
    }

    @GetMapping("/rides/{rideId}")
    public ResponseEntity<PaymentDto> getPaymentByRideId(@PathVariable Long rideId) {
        return ResponseEntity.ok(paymentService.getPaymentByRideId(rideId));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<PaymentDto> getPaymentByTransactionId(@PathVariable String transactionId) {
        return ResponseEntity.ok(paymentService.getPaymentByTransactionId(transactionId));
    }
}
