package com.eventsync.dto;

import java.time.LocalDate;

public record TaskResponse(
    Long id,
    Long eventId,
    String eventName,
    String title,
    String status,
    java.util.List<java.util.Map<String, Object>> assignees,
    LocalDate dueDate
) {}
