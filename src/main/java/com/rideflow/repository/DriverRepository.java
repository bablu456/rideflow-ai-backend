package com.rideflow.repository;

import com.rideflow.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    List<Driver> findByIsAvailableTrue();

    Optional<Driver> findByUserId(Long userId);

    /**
     * Geospatial search placeholder: finds available drivers within a bounding box.
     * For production, consider PostGIS extensions for accurate distance queries.
     */
    List<Driver> findByIsAvailableTrueAndCurrentLatitudeBetweenAndCurrentLongitudeBetween(
            Double minLat, Double maxLat, Double minLon, Double maxLon);

    /**
     * Native query for nearest drivers using PostgreSQL distance calculation.
     * NOTE: For production use PostGIS with ST_DWithin for proper geospatial
     * indexing.
     */
    @Query(value = "SELECT d.* FROM drivers d " +
            "WHERE d.is_available = true " +
            "ORDER BY SQRT(POWER(d.current_latitude - :lat, 2) + POWER(d.current_longitude - :lon, 2)) ASC " +
            "LIMIT 10", nativeQuery = true)
    List<Driver> findNearestDrivers(@Param("lat") Double lat, @Param("lon") Double lon);
}
