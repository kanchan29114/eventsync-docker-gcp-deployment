package com.eventsync.repository;

import com.eventsync.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByEventIdOrderByTimestampDesc(Long eventId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByEventId(Long eventId);
}
