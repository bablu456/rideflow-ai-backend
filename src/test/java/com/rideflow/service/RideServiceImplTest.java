package com.rideflow.service;

import com.rideflow.dto.RideDto;
import com.rideflow.dto.RideRequestDto;
import com.rideflow.entity.Driver;
import com.rideflow.entity.Ride;
import com.rideflow.entity.RideStatus;
import com.rideflow.entity.User;
import com.rideflow.repository.DriverRepository;
import com.rideflow.repository.RideRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.service.impl.RideServiceImpl;
import com.rideflow.utils.DistanceCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RideServiceImplTest {

    @Mock
    private RideRepository rideRepository;

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DistanceCalculator distanceCalculator;

    @InjectMocks
    private RideServiceImpl rideService;

    private User passenger;
    private Driver driver;
    private RideRequestDto requestDto;

    @BeforeEach
    void setUp() {
        passenger = new User();
        passenger.setId(1L);
        passenger.setName("Test Passenger");

        driver = new Driver();
        driver.setId(1L);
        driver.setIsAvailable(true);
        User driverUser = new User();
        driverUser.setName("Test Driver");
        driver.setUser(driverUser);

        requestDto = new RideRequestDto();
        requestDto.setPassengerId(1L);
        requestDto.setPickupLatitude(12.97);
        requestDto.setPickupLongitude(77.59);
        requestDto.setDropLatitude(12.93);
        requestDto.setDropLongitude(77.62);
        requestDto.setVehicleType("Car");
    }

    @Test
    void requestRide_ShouldBookRide_WhenDriverIsAvailable() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(passenger));
        when(driverRepository.findByIsAvailableTrue()).thenReturn(List.of(driver));
        when(distanceCalculator.calculateDistance(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(5.0); // 5 km distance
        when(rideRepository.save(any(Ride.class))).thenAnswer(invocation -> {
            Ride ride = invocation.getArgument(0);
            ride.setId(100L);
            return ride;
        });

        RideDto result = rideService.requestRide(requestDto);

        assertNotNull(result);
        assertEquals(RideStatus.REQUESTED, result.getStatus());
        assertNull(result.getDriverName());

        assertTrue(driver.getIsAvailable());
        verify(driverRepository, never()).save(driver);
        verify(distanceCalculator, times(1)).calculateDistance(anyDouble(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    void requestRide_ShouldThrowException_WhenNoDriverAvailable() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(passenger));
        when(driverRepository.findByIsAvailableTrue()).thenReturn(List.of());

        Exception exception = assertThrows(RuntimeException.class, () -> {
            rideService.requestRide(requestDto);
        });

        assertEquals("No Drivers Available nearby!", exception.getMessage());
    }
}
