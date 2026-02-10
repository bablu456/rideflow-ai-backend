package com.rideflow.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embeddable location object representing a geographical point with an address.
 * Used in Ride entity for pickup and drop locations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class Location {

    private Double latitude;

    private Double longitude;

    private String address;
}
