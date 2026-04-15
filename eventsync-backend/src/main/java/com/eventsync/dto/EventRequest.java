package com.eventsync.dto;

import java.time.LocalDateTime;

public record EventRequest(
    String title,
    String description,
    LocalDateTime date,
    String location,
    Double budget
) {}
