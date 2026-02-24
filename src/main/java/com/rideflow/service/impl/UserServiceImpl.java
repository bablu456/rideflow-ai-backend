package com.rideflow.service.impl;

import com.rideflow.dto.UserProfileDto;
import com.rideflow.dto.UserProfileUpdateRequest;
import com.rideflow.dto.WalletAddRequest;
import com.rideflow.dto.WalletAddResponse;
import com.rideflow.entity.PaymentMethod;
import com.rideflow.entity.User;
import com.rideflow.exception.ResourceNotFoundException;
import com.rideflow.repository.UserRepository;
import com.rideflow.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserProfileDto getCurrentUserProfile(String email) {
        User user = getUserByEmail(email);
        return toProfileDto(user);
    }

    @Override
    @Transactional
    public UserProfileDto updateCurrentUserProfile(String email, UserProfileUpdateRequest request) {
        User user = getUserByEmail(email);

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getProfilePicture() != null && !request.getProfilePicture().isBlank()) {
            user.setProfilePicture(request.getProfilePicture().trim());
        }

        return toProfileDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public WalletAddResponse addMoneyToWallet(String email, WalletAddRequest request) {
        User user = getUserByEmail(email);
        PaymentMethod method = request.getPaymentMethod();

        if (method != PaymentMethod.UPI && method != PaymentMethod.CARD) {
            throw new RuntimeException("Wallet top-up supports only UPI or CARD");
        }

        double currentBalance = safeAmount(user.getWalletBalance());
        double updatedBalance = roundToTwoDecimals(currentBalance + request.getAmount());
        user.setWalletBalance(updatedBalance);
        userRepository.save(user);

        return WalletAddResponse.builder()
                .addedAmount(roundToTwoDecimals(request.getAmount()))
                .paymentMethod(method)
                .walletBalance(updatedBalance)
                .message("Wallet balance updated successfully")
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private UserProfileDto toProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profilePicture(user.getProfilePicture())
                .walletBalance(safeAmount(user.getWalletBalance()))
                .roles(user.getRoles())
                .build();
    }

    private double safeAmount(Double value) {
        return value == null ? 0.0 : roundToTwoDecimals(value);
    }

    private double roundToTwoDecimals(double amount) {
        return Math.round(amount * 100.0) / 100.0;
    }
}
