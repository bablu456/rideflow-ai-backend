package com.rideflow.controller;

import com.rideflow.entity.Driver;
import com.rideflow.service.DriverService;
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
}
