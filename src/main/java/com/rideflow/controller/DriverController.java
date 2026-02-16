package com.rideflow.controller;

import com.rideflow.dto.DriverLocationUpdateRequest;
import com.rideflow.dto.DriverNearbyDto;
import com.rideflow.dto.DriverProfileStatsResponse;
import com.rideflow.dto.DriverProfileUpdateRequest;
import com.rideflow.entity.Driver;
import com.rideflow.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverController {

    private final DriverService driverService;

    @PostMapping("/register")
    public ResponseEntity<Driver> registerDriver(@RequestBody Driver driver) {
        return ResponseEntity.ok(driverService.registerDriver(driver));
    }

    @GetMapping("/me")
    public ResponseEntity<Driver> getMyDriverProfile(Authentication authentication) {
        return ResponseEntity.ok(driverService.getDriverByUserEmail(authentication.getName()));
    }

    @GetMapping("/me/stats")
    public ResponseEntity<DriverProfileStatsResponse> getMyProfileStats(Authentication authentication) {
        return ResponseEntity.ok(driverService.getDriverProfileStats(authentication.getName()));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<DriverProfileStatsResponse> updateMyProfile(
            Authentication authentication,
            @RequestBody @Valid DriverProfileUpdateRequest request) {
        return ResponseEntity.ok(driverService.updateDriverProfile(authentication.getName(), request));
    }

    @PutMapping("/me/location")
    public ResponseEntity<Driver> updateMyLocation(
            Authentication authentication,
            @RequestBody @Valid DriverLocationUpdateRequest request) {
        Driver me = driverService.getDriverByUserEmail(authentication.getName());
        return ResponseEntity.ok(driverService.updateCurrentLocation(
                me.getId(),
                request.getLatitude(),
                request.getLongitude()));
    }

    @PutMapping("/{driverId}/availability")
    public ResponseEntity<Driver> updateAvailability(
            @PathVariable Long driverId,
            @RequestParam boolean available) {
        return ResponseEntity.ok(driverService.updateAvailability(driverId, available));
    }

    @GetMapping
    public ResponseEntity<List<Driver>> getAvailableDrivers() {
        return ResponseEntity.ok(driverService.findAvailableDrivers());
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<DriverNearbyDto>> getNearbyDrivers(
            @RequestParam Double pLat,
            @RequestParam Double pLon,
            @RequestParam(required = false) Double radiusKm) {
        return ResponseEntity.ok(driverService.findNearbyDrivers(pLat, pLon, radiusKm));
    }
}
