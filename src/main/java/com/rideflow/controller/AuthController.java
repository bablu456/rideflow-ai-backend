package com.rideflow.controller;

import com.rideflow.security.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login (@RequestBody AuthRequestDto request){

        String token = jwtUtil.generateToken(request.getUsername());
        return ResponseEntity.ok(new AuthResponseDto(token));
    }
}

@Data
class AuthRequestDto{
    private String username;
    private String password;
}

@Data
class AuthResponseDto{
    private String token;

    public AuthResponseDto(String token){
        this.token = token;
    }
}
