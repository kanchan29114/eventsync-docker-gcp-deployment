package com.eventsync.dto;

import java.time.LocalDateTime;

public record EventResponse(
    Long id,
    String title,
    String description,
    LocalDateTime date,
    String location,
    Double budget,
    Long hostId,
    String hostName,
    String hostEmail,
    String status
) {}
