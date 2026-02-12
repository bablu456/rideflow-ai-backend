package com.rideflow.service.impl;

import com.rideflow.dto.PaymentDto;
import com.rideflow.dto.PaymentInitiateRequest;
import com.rideflow.entity.Payment;
import com.rideflow.entity.PaymentStatus;
import com.rideflow.entity.Ride;
import com.rideflow.entity.RideStatus;
import com.rideflow.exception.ResourceNotFoundException;
import com.rideflow.repository.PaymentRepository;
import com.rideflow.repository.RideRepository;
import com.rideflow.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final RideRepository rideRepository;

    @Override
    @Transactional
    public PaymentDto initiatePayment(Long rideId, PaymentInitiateRequest request) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride", "id", rideId));

        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new RuntimeException("Payment can only be initiated after ride completion");
        }

        if (paymentRepository.findByRideId(rideId).isPresent()) {
            throw new RuntimeException("Payment already initiated for this ride");
        }

        Payment payment = Payment.builder()
                .ride(ride)
                .amount(ride.getFare())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .transactionId(generateTransactionId())
                .build();

        return mapToDto(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentDto completePayment(String transactionId) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "transactionId", transactionId));

        if (payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
            throw new RuntimeException("Payment is already completed");
        }

        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        return mapToDto(paymentRepository.save(payment));
    }

    @Override
    public PaymentDto getPaymentByRideId(Long rideId) {
        Payment payment = paymentRepository.findByRideId(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "rideId", rideId));
        return mapToDto(payment);
    }

    @Override
    public PaymentDto getPaymentByTransactionId(String transactionId) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "transactionId", transactionId));
        return mapToDto(payment);
    }

    private String generateTransactionId() {
        return "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    private PaymentDto mapToDto(Payment payment) {
        return PaymentDto.builder()
                .id(payment.getId())
                .rideId(payment.getRide() != null ? payment.getRide().getId() : null)
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .transactionId(payment.getTransactionId())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
