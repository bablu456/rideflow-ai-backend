package com.rideflow.repository;

import com.rideflow.entity.Driver;
import com.rideflow.entity.Ride;
import com.rideflow.entity.RideStatus;
import com.rideflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {

    List<Ride> findByRiderId(Long riderId);

    List<Ride> findByDriverId(Long driverId);

    List<Ride> findByRider(User rider);

    List<Ride> findByDriver(Driver driver);

    List<Ride> findByStatus(RideStatus status);

    List<Ride> findByStatusOrderByCreatedAtDesc(RideStatus status);

    long countByDriverIdAndStatus(Long driverId, RideStatus status);

    @Query("SELECT COALESCE(SUM(r.fare), 0) FROM Ride r WHERE r.driver.id = :driverId AND r.status = :status")
    Double sumFareByDriverIdAndStatus(@Param("driverId") Long driverId, @Param("status") RideStatus status);
}
