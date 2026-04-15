package com.eventsync.repository;

import com.eventsync.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByEventId(Long eventId);
    List<Task> findByAssigneesIdOrderByDueDateAsc(Long assigneeId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByEventId(Long eventId);
}
