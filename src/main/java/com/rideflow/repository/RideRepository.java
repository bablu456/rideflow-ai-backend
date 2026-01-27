package com.rideflow.repository;

import com.rideflow.entity.Ride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RideRepository extends JpaRepository<Ride, Long>{

    List<Ride> findByRiderId(long riderId);

    List<Ride> findByDriverId(Long driverId);
}
