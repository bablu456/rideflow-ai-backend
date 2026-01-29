package com.rideflow.controller;


import com.rideflow.dto.RideDto;
import com.rideflow.dto.RideRequestDto;
import com.rideflow.service.RiderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor

public class RideController {

    private final RiderService riderService;

    @PostMapping("/request")
    public ResponseEntity<RideDto> requestRide(@RequestBody RideRequestDto rideRequestDto){
    return ResponseEntity.ok(riderService.requestRide(rideRequestDto));
    }

    @GetMapping("/{rideId}")
    public ResponseEntity<RideDto> getRideStatus(@PathVariable Long rideId){
        return ResponseEntity.ok(riderService.getRideStatus(rideId));
    }


}
