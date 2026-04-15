package com.eventsync.controller;

import com.eventsync.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Simple test controller to verify Gmail SMTP is working.
 * Usage: GET http://localhost:8080/api/test/email?to=your@gmail.com
 *
 * REMOVE or comment out this controller before deploying to production.
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestEmailController {

    private final EmailService emailService;

    @GetMapping("/email")
    public ResponseEntity<String> sendTestEmail(@RequestParam String to) {
        emailService.sendInvitationEmail(
            to,
            "Test User",
            "EventSync System",
            "Test Event",
            0L // Dummy invite id for test
        );
        return ResponseEntity.ok("Email triggered! Check console logs and your inbox (and spam folder).");
    }
}
