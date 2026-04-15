package com.eventsync.service;

import com.eventsync.dto.PasswordChangeRequest;
import com.eventsync.dto.UserProfileUpdate;
import com.eventsync.dto.UserResponse;
import com.eventsync.model.User;
import com.eventsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserResponse getMyProfile() {
        User user = getCurrentUser();
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }

    public UserResponse updateProfile(UserProfileUpdate update) {
        User user = getCurrentUser();
        if (update.name() != null && !update.name().trim().isEmpty()) {
            user.setName(update.name());
        }
        user = userRepository.save(user);
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }

    public void changePassword(PasswordChangeRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (request.newPassword() == null || request.newPassword().trim().length() < 6) {
             throw new RuntimeException("New password must be at least 6 characters");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
