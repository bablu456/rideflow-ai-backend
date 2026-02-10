package com.rideflow.service;

import com.rideflow.dto.AuthRequest;
import com.rideflow.dto.AuthResponse;
import com.rideflow.dto.RegisterRequest;
import com.rideflow.entity.Driver;
import com.rideflow.entity.User;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

        private final UserRepository repository;
        private final DriverRepository driverRepository;
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
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .phone(request.getPhone())
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

                User user = repository.findByEmail(request.getEmail())
                                .orElseThrow();

                // Backfill driver profile for old accounts having DRIVER role
                ensureDriverProfileIfNeeded(user, null);

                return buildAuthResponse(user);
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
