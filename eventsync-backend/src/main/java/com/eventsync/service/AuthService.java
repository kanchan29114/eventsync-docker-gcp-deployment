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

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already taken");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();
        userRepository.save(user);

        var userDetails = new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), new ArrayList<>());
        var jwtToken = jwtUtil.generateToken(userDetails);
        
        return new AuthResponse(jwtToken, user.getId(), user.getName(), user.getEmail());
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        var user = userRepository.findByEmail(request.email())
                .orElseThrow();
        var userDetails = new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), new ArrayList<>());
        var jwtToken = jwtUtil.generateToken(userDetails);
        
        return new AuthResponse(jwtToken, user.getId(), user.getName(), user.getEmail());
    }
}
