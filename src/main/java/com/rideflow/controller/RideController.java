package com.rideflow.controller;

import com.rideflow.dto.FareDto;
import com.rideflow.dto.RideDto;
import com.rideflow.dto.RideRequestDto;
import com.rideflow.dto.StartRideRequestDto;
import com.rideflow.service.RiderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RideController {

    private final RiderService riderService;

    @PostMapping("/request")
    public ResponseEntity<RideDto> requestRide(@RequestBody @Valid RideRequestDto rideRequestDto) {
        return ResponseEntity.ok(riderService.requestRide(rideRequestDto));
    }

    @GetMapping("/{rideId:\\d+}")
    public ResponseEntity<RideDto> getRideStatus(@PathVariable Long rideId) {
        return ResponseEntity.ok(riderService.getRideStatus(rideId));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<RideDto>> getRidesForDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(riderService.getRidesForDriver(driverId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<RideDto>> getAvailableRides() {
        return ResponseEntity.ok(riderService.getAvailableRides());
    }

    @PostMapping("/{rideId}/accept")
    public ResponseEntity<RideDto> acceptRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(riderService.acceptRide(rideId));
    }

    @PostMapping("/{rideId}/start")
    public ResponseEntity<RideDto> startRide(@PathVariable Long rideId,
            @RequestBody @Valid StartRideRequestDto request) {
        return ResponseEntity.ok(riderService.startRide(rideId, request.getOtp()));
    }

    @PostMapping("/{rideId}/complete")
    public ResponseEntity<RideDto> completeRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(riderService.completeRide(rideId));
    }

    @PostMapping("/{rideId}/cancel")
    public ResponseEntity<RideDto> cancelRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(riderService.cancelRide(rideId));
    }

    @GetMapping("/calculate")
    public ResponseEntity<FareDto> calculateFare(
            @RequestParam Double pLat,
            @RequestParam Double pLon,
            @RequestParam Double dLat,
            @RequestParam Double dLon) {
        return ResponseEntity.ok(riderService.calculateRideFares(pLat, pLon, dLat, dLon));
    }
}
