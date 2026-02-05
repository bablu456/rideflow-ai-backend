package com.rideflow.repository;

import com.rideflow.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository  extends JpaRepository<Driver, Long> {

    List<Driver> findByAvailableTrue();



    @Query(value = "SELECT d.*, " +
            "ST_DistanceSphere(POINT(d.longitude, d.latitude), POINT(:lon, :lat)) as distance " +
            "FROM drivers d " +
            "WHERE d.available = true " +
            "ORDER BY distance ASC " +
            "LIMIT 10", nativeQuery = true)
    List<Driver> findNearestDrivers(@Param("lat") Double lat, @Param("lon") Double lon);
}
