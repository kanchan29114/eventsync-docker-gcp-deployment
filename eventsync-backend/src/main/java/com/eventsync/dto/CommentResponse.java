package com.eventsync.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long eventId,
        Long userId,
        String userName,
        String message,
        LocalDateTime createdAt
) {}
