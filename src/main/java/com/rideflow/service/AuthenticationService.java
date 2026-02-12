package com.rideflow.service;

import com.rideflow.dto.AuthRequest;
import com.rideflow.dto.AuthResponse;
import com.rideflow.dto.MessageResponse;
import com.rideflow.dto.OtpDispatchResponse;
import com.rideflow.dto.OtpLoginRequest;
import com.rideflow.dto.OtpSendRequest;
import com.rideflow.dto.RegisterRequest;
import com.rideflow.dto.ResetPasswordRequest;
import com.rideflow.entity.Driver;
import com.rideflow.entity.OtpCode;
import com.rideflow.entity.OtpPurpose;
import com.rideflow.entity.User;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.OtpCodeRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    private final UserRepository repository;
    private final DriverRepository driverRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        Set<String> roles = new HashSet<>();
        if (request.getRole() != null && !request.getRole().isBlank()) {
            roles.add(request.getRole().trim().toUpperCase());
        } else {
            roles.add("RIDER");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail() == null ? null : request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() == null ? null : request.getPhone().trim())
                .roles(roles)
                .build();

        User savedUser = repository.save(user);
        ensureDriverProfileIfNeeded(savedUser, request);

        return buildAuthResponse(savedUser);
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        User user = repository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        ensureDriverProfileIfNeeded(user, null);
        return buildAuthResponse(user);
    }

    @Transactional
    public OtpDispatchResponse sendLoginOtp(OtpSendRequest request) {
        User user = findUserByIdentifier(request.getIdentifier());
        return issueOtp(user, OtpPurpose.LOGIN, "Login OTP sent successfully");
    }

    @Transactional
    public AuthResponse loginWithOtp(OtpLoginRequest request) {
        User user = validateOtp(request.getIdentifier(), request.getOtp(), OtpPurpose.LOGIN);
        ensureDriverProfileIfNeeded(user, null);
        return buildAuthResponse(user);
    }

    @Transactional
    public OtpDispatchResponse sendPasswordResetOtp(OtpSendRequest request) {
        User user = findUserByIdentifier(request.getIdentifier());
        return issueOtp(user, OtpPurpose.PASSWORD_RESET, "Password reset OTP sent successfully");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = validateOtp(request.getIdentifier(), request.getOtp(), OtpPurpose.PASSWORD_RESET);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        repository.save(user);
        return new MessageResponse("Password reset successful. Please login again.");
    }

    private OtpDispatchResponse issueOtp(User user, OtpPurpose purpose, String message) {
        LocalDateTime now = LocalDateTime.now();
        invalidateExistingOtps(user, purpose, now);

        String otpCode = generateOtp();
        OtpCode otp = OtpCode.builder()
                .user(user)
                .purpose(purpose)
                .code(otpCode)
                .expiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        otpCodeRepository.save(otp);

        System.out.println("OTP [" + purpose + "] for user " + user.getEmail() + ": " + otpCode);

        return OtpDispatchResponse.builder()
                .message(message)
                .expiresAt(otp.getExpiresAt())
                .debugOtp(otpCode)
                .build();
    }

    private User validateOtp(String identifier, String otp, OtpPurpose purpose) {
        User user = findUserByIdentifier(identifier);
        OtpCode latestOtp = otpCodeRepository.findTopByUserAndPurposeAndUsedAtIsNullOrderByCreatedAtDesc(user, purpose)
                .orElseThrow(() -> new RuntimeException("OTP not requested. Please request a new OTP."));

        LocalDateTime now = LocalDateTime.now();
        if (latestOtp.getExpiresAt().isBefore(now)) {
            latestOtp.setUsedAt(now);
            otpCodeRepository.save(latestOtp);
            throw new RuntimeException("OTP expired. Please request a new OTP.");
        }

        String normalizedOtp = otp == null ? "" : otp.trim();
        if (!latestOtp.getCode().equals(normalizedOtp)) {
            throw new RuntimeException("Invalid OTP");
        }

        latestOtp.setUsedAt(now);
        otpCodeRepository.save(latestOtp);
        return user;
    }

    private void invalidateExistingOtps(User user, OtpPurpose purpose, LocalDateTime now) {
        List<OtpCode> activeOtps = otpCodeRepository.findByUserAndPurposeAndUsedAtIsNull(user, purpose);
        if (activeOtps.isEmpty()) {
            return;
        }

        activeOtps.forEach(otp -> otp.setUsedAt(now));
        otpCodeRepository.saveAll(activeOtps);
    }

    private User findUserByIdentifier(String identifier) {
        String normalized = normalizeIdentifier(identifier);

        if (normalized.contains("@")) {
            return repository.findByEmailIgnoreCase(normalized)
                    .orElseThrow(() -> new RuntimeException("User not found for provided identifier"));
        }

        return repository.findByPhone(normalized)
                .orElseThrow(() -> new RuntimeException("User not found for provided identifier"));
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new RuntimeException("Identifier is required");
        }

        return identifier.trim().toLowerCase();
    }

    private String generateOtp() {
        return String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
    }

    private void ensureDriverProfileIfNeeded(User user, RegisterRequest request) {
        if (user.getRoles() == null || !user.getRoles().contains("DRIVER")) {
            return;
        }

        if (driverRepository.findByUserId(user.getId()).isPresent()) {
            return;
        }

        Driver driver = new Driver();
        driver.setUser(user);
        driver.setLicenseNumber(getOrDefault(request == null ? null : request.getLicenseNumber(), "TEMP-LICENSE-" + user.getId()));
        driver.setVehicleType(getOrDefault(request == null ? null : request.getVehicleType(), "Car"));
        driver.setVehiclePlateNumber(getOrDefault(request == null ? null : request.getVehiclePlateNumber(), "TEMP-PLATE-" + user.getId()));
        driver.setIsAvailable(request != null && request.getAvailable() != null ? request.getAvailable() : true);
        driver.setRating(5.0);
        driver.setCurrentLatitude(request != null && request.getCurrentLatitude() != null ? request.getCurrentLatitude() : 12.97);
        driver.setCurrentLongitude(request != null && request.getCurrentLongitude() != null ? request.getCurrentLongitude() : 77.59);
        driverRepository.save(driver);
    }

    private String getOrDefault(String value, String defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return value.trim();
    }

    private AuthResponse buildAuthResponse(User user) {
        String jwtToken = jwtService.generateToken(user);
        Long driverId = driverRepository.findByUserId(user.getId())
                .map(Driver::getId)
                .orElse(null);

        String primaryRole = "RIDER";
        if (user.getRoles() != null && user.getRoles().contains("DRIVER")) {
            primaryRole = "DRIVER";
        }

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .roles(user.getRoles())
                .primaryRole(primaryRole)
                .driverId(driverId)
                .build();
    }
}
