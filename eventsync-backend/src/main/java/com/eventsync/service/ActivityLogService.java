package com.eventsync.service;

import com.eventsync.dto.ActivityLogResponse;
import com.eventsync.model.ActivityLog;
import com.eventsync.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public void logActivity(Long eventId, String action, String performedBy) {
        ActivityLog log = ActivityLog.builder()
                .eventId(eventId)
                .action(action)
                .performedBy(performedBy)
                .timestamp(LocalDateTime.now())
                .build();
        activityLogRepository.save(log);
    }

    public List<ActivityLogResponse> getEventActivities(Long eventId) {
        return activityLogRepository.findByEventIdOrderByTimestampDesc(eventId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return new ActivityLogResponse(
                log.getId(),
                log.getEventId(),
                log.getAction(),
                log.getPerformedBy(),
                log.getTimestamp()
        );
    }
}
