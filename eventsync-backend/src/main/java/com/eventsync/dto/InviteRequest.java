package com.eventsync.dto;

import com.eventsync.model.Role;

public record InviteRequest(
    String email,
    Role role
) {}
