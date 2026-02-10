package com.rideflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String licenseNumber;

    private String vehicleType; // e.g., "Car", "Bike"

    private String vehiclePlateNumber;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Double rating = 5.0;

    // ─── Real-time Coordinates ──────────────────────────────────

    private Double currentLatitude;

    private Double currentLongitude;
}
