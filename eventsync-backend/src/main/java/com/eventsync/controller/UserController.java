package com.eventsync.controller;

import com.eventsync.dto.PasswordChangeRequest;
import com.eventsync.dto.UserProfileUpdate;
import com.eventsync.dto.UserResponse;
import com.eventsync.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile() {
        return ResponseEntity.ok(userService.getMyProfile());
    }

    @PutMapping("/update")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody UserProfileUpdate update) {
        return ResponseEntity.ok(userService.updateProfile(update));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody PasswordChangeRequest request) {
        userService.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}
