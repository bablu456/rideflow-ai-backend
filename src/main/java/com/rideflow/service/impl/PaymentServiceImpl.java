package com.rideflow.service.impl;

import com.rideflow.dto.PaymentDto;
import com.rideflow.dto.PaymentInitiateRequest;
import com.rideflow.entity.Payment;
import com.rideflow.entity.PaymentMethod;
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
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Pattern UPI_ID_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$");

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

        String normalizedUpiId = normalizeUpiId(request.getUpiId());
        if (request.getPaymentMethod() == PaymentMethod.UPI) {
            if (normalizedUpiId == null) {
                throw new RuntimeException("UPI ID is required for UPI payments");
            }
            if (!UPI_ID_PATTERN.matcher(normalizedUpiId).matches()) {
                throw new RuntimeException("Invalid UPI ID format. Example: yourname@bank");
            }
        } else {
            normalizedUpiId = null;
        }

        Payment payment = Payment.builder()
                .ride(ride)
                .amount(ride.getFare())
                .paymentMethod(request.getPaymentMethod())
                .upiId(normalizedUpiId)
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
                .upiId(maskUpiId(payment.getUpiId()))
                .paymentStatus(payment.getPaymentStatus())
                .transactionId(payment.getTransactionId())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private String normalizeUpiId(String upiId) {
        if (upiId == null) {
            return null;
        }

        String trimmedUpiId = upiId.trim();
        return trimmedUpiId.isEmpty() ? null : trimmedUpiId.toLowerCase();
    }

    private String maskUpiId(String upiId) {
        if (upiId == null || upiId.isBlank()) {
            return null;
        }

        int atIndex = upiId.indexOf('@');
        if (atIndex <= 0) {
            return "****";
        }

        String localPart = upiId.substring(0, atIndex);
        String handlePart = upiId.substring(atIndex);

        if (localPart.length() <= 2) {
            return localPart.charAt(0) + "*" + handlePart;
        }

        return localPart.substring(0, 2) + "*".repeat(localPart.length() - 2) + handlePart;
    }
}
