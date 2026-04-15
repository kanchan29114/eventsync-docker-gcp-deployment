package com.eventsync.repository;

import com.eventsync.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByHostId(Long hostId);

    // Find events where the user has been invited (exists in event_members table)
    @Query("SELECT em.event FROM EventMember em WHERE em.user.id = :userId")
    List<Event> findInvitedEventsByUserId(@Param("userId") Long userId);
}
