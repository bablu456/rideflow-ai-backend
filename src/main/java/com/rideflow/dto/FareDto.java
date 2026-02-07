package com.rideflow.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FareDto {
    private Double bikeFare;
    private Double autoFare;
    private Double carFare;
    private Double premierFare;
    private Double distanceKm;

}
