package com.eventsync.dto;

import java.time.LocalDateTime;

public record ActivityLogResponse(
        Long id,
        Long eventId,
        String action,
        String performedBy,
        LocalDateTime timestamp
) {}
