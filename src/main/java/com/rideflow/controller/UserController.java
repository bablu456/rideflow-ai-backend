package com.rideflow.controller;

import com.rideflow.dto.UserProfileDto;
import com.rideflow.dto.UserProfileUpdateRequest;
import com.rideflow.dto.WalletAddRequest;
import com.rideflow.dto.WalletAddResponse;
import com.rideflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUserProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDto> updateCurrentUserProfile(
            Authentication authentication,
            @RequestBody @Valid UserProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updateCurrentUserProfile(authentication.getName(), request));
    }

    @PostMapping("/wallet/add")
    public ResponseEntity<WalletAddResponse> addMoneyToWallet(
            Authentication authentication,
            @RequestBody @Valid WalletAddRequest request) {
        return ResponseEntity.ok(userService.addMoneyToWallet(authentication.getName(), request));
    }
}
