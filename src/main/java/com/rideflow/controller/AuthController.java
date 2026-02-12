package com.rideflow.controller;

import com.rideflow.dto.AuthRequest;
import com.rideflow.dto.AuthResponse;
import com.rideflow.dto.MessageResponse;
import com.rideflow.dto.OtpDispatchResponse;
import com.rideflow.dto.OtpLoginRequest;
import com.rideflow.dto.OtpSendRequest;
import com.rideflow.dto.RegisterRequest;
import com.rideflow.dto.ResetPasswordRequest;
import com.rideflow.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/otp/send-login")
    public ResponseEntity<OtpDispatchResponse> sendLoginOtp(@RequestBody @Valid OtpSendRequest request) {
        return ResponseEntity.ok(service.sendLoginOtp(request));
    }

    @PostMapping("/otp/login")
    public ResponseEntity<AuthResponse> loginWithOtp(@RequestBody @Valid OtpLoginRequest request) {
        return ResponseEntity.ok(service.loginWithOtp(request));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<OtpDispatchResponse> forgotPassword(@RequestBody @Valid OtpSendRequest request) {
        return ResponseEntity.ok(service.sendPasswordResetOtp(request));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        return ResponseEntity.ok(service.resetPassword(request));
    }

}
