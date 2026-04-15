package com.eventsync.controller;

import com.eventsync.dto.ActivityLogResponse;
import com.eventsync.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/events/{eventId}/activity")
    public ResponseEntity<List<ActivityLogResponse>> getEventActivities(@PathVariable Long eventId) {
        return ResponseEntity.ok(activityLogService.getEventActivities(eventId));
    }
}
