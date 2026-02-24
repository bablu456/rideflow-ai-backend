package com.rideflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class UserProfileDto {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String profilePicture;
    private Double walletBalance;
    private Set<String> roles;
}
