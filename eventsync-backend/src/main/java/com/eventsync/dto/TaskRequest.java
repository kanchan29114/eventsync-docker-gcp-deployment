package com.eventsync.dto;

import com.eventsync.model.TaskStatus;

import java.time.LocalDate;

public record TaskRequest(
    String title,
    TaskStatus status,
    java.util.List<Long> assigneeIds,
    LocalDate dueDate
) {}
