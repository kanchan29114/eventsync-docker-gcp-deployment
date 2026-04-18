package com.eventsync.service;

import com.eventsync.dto.AuthRequest;
import com.eventsync.dto.AuthResponse;
import com.eventsync.dto.RegisterRequest;
import com.eventsync.model.User;
import com.eventsync.repository.UserRepository;
import com.eventsync.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user with email: {}", request.email());
        if (userRepository.existsByEmail(request.email())) {
            log.warn("Registration failed: Email {} already taken", request.email());
            throw new RuntimeException("Email already taken");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();
        User savedUser = userRepository.save(user);

        var userDetails = new org.springframework.security.core.userdetails.User(savedUser.getEmail(), savedUser.getPassword(), new ArrayList<>());
        var jwtToken = jwtUtil.generateToken(userDetails);
        
        return new AuthResponse(jwtToken, savedUser.getId(), savedUser.getName(), savedUser.getEmail());
    }

    public AuthResponse authenticate(AuthRequest request) {
        log.info("Attempting to authenticate user with email: {}", request.email());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (Exception e) {
            log.error("Authentication failed for email: {} - Error: {}", request.email(), e.getMessage());
            throw e;
        }
        var user = userRepository.findByEmail(request.email())
                .orElseThrow();
        var userDetails = new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), new ArrayList<>());
        var jwtToken = jwtUtil.generateToken(userDetails);
        
        return new AuthResponse(jwtToken, user.getId(), user.getName(), user.getEmail());
    }
}
