package com.rideflow.entity; // Apna package name check karo

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "app_users") // Table name "user" mat rakhna, Postgres mein reserved word hai
public class User implements UserDetails { // 🔥 1. Implements UserDetails

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    private String phone;

    private String role; // e.g., "USER", "DRIVER"

    // 🔥 2. UserDetails Methods Implementation

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); // Abhi ke liye empty role list bhej rahe hain
    }

    @Override
    public String getUsername() {
        return email; // 🔥 Hum username ki jagah 'email' use kar rahe hain
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}