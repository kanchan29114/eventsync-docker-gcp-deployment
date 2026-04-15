package com.eventsync.dto;

public record PasswordChangeRequest(
    String currentPassword,
    String newPassword
) {}
