package com.rideflow.controller;

import com.rideflow.entity.Driver;
import com.rideflow.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @PostMapping
    public ResponseEntity<Driver> registerDriver(@RequestBody Driver driver){
        return ResponseEntity.ok(driverService.registerDriver(driver));
    }

    @PutMapping("/{driverId}/availability")
    public ResponseEntity<Driver> updateAvailability(
            @PathVariable Long driverId,
            @RequestParam boolean available){
        return ResponseEntity.ok(driverService.updateAvailability(driverId, available));
    }

    @GetMapping
    public ResponseEntity<List<Driver>> getAvailableDrivers(){
        return ResponseEntity.ok(driverService.findAvailableDrivers());
    }
}
