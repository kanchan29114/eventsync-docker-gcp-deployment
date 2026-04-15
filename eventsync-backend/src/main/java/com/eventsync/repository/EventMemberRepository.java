package com.eventsync.repository;

import com.eventsync.model.EventMember;
import com.eventsync.model.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EventMemberRepository extends JpaRepository<EventMember, Long> {
    List<EventMember> findByEventId(Long eventId);
    List<EventMember> findByUserId(Long userId);
    List<EventMember> findByUserIdAndStatus(Long userId, MemberStatus status);
    Optional<EventMember> findByEventIdAndUserId(Long eventId, Long userId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByEventId(Long eventId);
}
