package com.eventsync.dto;

import com.eventsync.model.Role;
import com.eventsync.model.MemberStatus;

public record InviteResponse(
    Long id,
    Long eventId,
    Long userId,
    String userName,
    String userEmail,
    Role role,
    MemberStatus status,
    boolean canAssignTasks
) {}
