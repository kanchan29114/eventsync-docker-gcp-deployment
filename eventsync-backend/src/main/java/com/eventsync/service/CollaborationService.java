package com.eventsync.service;

import com.eventsync.dto.InviteRequest;
import com.eventsync.dto.InviteResponse;
import com.eventsync.model.Event;
import com.eventsync.model.EventMember;
import com.eventsync.model.MemberStatus;
import com.eventsync.model.User;
import com.eventsync.repository.EventMemberRepository;
import com.eventsync.repository.EventRepository;
import com.eventsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollaborationService {

    private final EventMemberRepository eventMemberRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public InviteResponse inviteUser(Long eventId, InviteRequest request) {
        Event event = eventRepository.findById(eventId).orElseThrow();

        // Get the inviter (currently logged-in user)
        String inviterEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User inviter = userRepository.findByEmail(inviterEmail).orElseThrow();

        User targetUser = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.email()));

        if (inviter.getId().equals(targetUser.getId())) {
            throw new RuntimeException("You cannot invite yourself to your own event");
        }

        if (eventMemberRepository.findByEventIdAndUserId(eventId, targetUser.getId()).isPresent()) {
            throw new RuntimeException("User already invited or is a member");
        }

        EventMember member = EventMember.builder()
                .event(event)
                .user(targetUser)
                .role(request.role())
                .status(MemberStatus.PENDING)
                .build();

        member = eventMemberRepository.save(member);

        activityLogService.logActivity(eventId, inviter.getName() + " invited " + targetUser.getName(), inviter.getName());

        return mapToResponse(member);
    }

    /** Returns all PENDING invitations for the currently logged-in user. */
    public List<InviteResponse> getMyPendingInvitations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow();
        return eventMemberRepository.findByUserIdAndStatus(currentUser.getId(), MemberStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** Updates an invitation status (ACCEPTED / REJECTED). */
    public InviteResponse updateInviteStatus(Long inviteId, MemberStatus status) {
        EventMember member = eventMemberRepository.findById(inviteId)
                .orElseThrow(() -> new IllegalArgumentException("INVITATION_NOT_FOUND"));
                
        if (member.getStatus() != MemberStatus.PENDING) {
            throw new IllegalStateException("INVITATION_ALREADY_PROCESSED");
        }
        
        member.setStatus(status);
        member = eventMemberRepository.save(member);
        
        String action = status == MemberStatus.ACCEPTED ? " accepted invitation" : " rejected invitation";
        activityLogService.logActivity(member.getEvent().getId(), member.getUser().getName() + action, member.getUser().getName());
        
        return mapToResponse(member);
    }

    /** Host removes a member from their event. */
    public void removeMember(Long eventId, Long userId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Event event = eventRepository.findById(eventId).orElseThrow();
        
        if (!event.getHost().getEmail().equals(email)) {
            throw new RuntimeException("Only the host can remove members");
        }
        if (event.getHost().getId().equals(userId)) {
            throw new RuntimeException("Host cannot remove themselves from their own event");
        }

        EventMember member = eventMemberRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        eventMemberRepository.delete(member);
        
        String hostName = event.getHost().getName();
        activityLogService.logActivity(eventId, "Member '" + member.getUser().getName() + "' removed", hostName);
    }

    /** Returns all members of an event. */
    public List<InviteResponse> getEventMembers(Long eventId) {
        return eventMemberRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Checks if a user is an ACCEPTED member OR the host of the given event.
     * Used by TaskService to gate task creation/update.
     */
    public boolean isAcceptedMemberOrHost(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId).orElseThrow();
        if (event.getHost().getId().equals(userId)) return true;
        return eventMemberRepository
                .findByEventIdAndUserId(eventId, userId)
                .map(m -> m.getStatus() == MemberStatus.ACCEPTED)
                .orElse(false);
    }
    
    /** Checks if a user possesses explicit permission to assign tasks. */
    public boolean canAssignTasks(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId).orElseThrow();
        if (event.getHost().getId().equals(userId)) return true;
        return eventMemberRepository.findByEventIdAndUserId(eventId, userId)
                .map(EventMember::isCanAssignTasks)
                .orElse(false);
    }

    /** Uniquely allows the application Host to update specific role authorizations. */
    public void updateMemberPermissions(Long eventId, Long userId, boolean canAssignTasks) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Event event = eventRepository.findById(eventId).orElseThrow();
        
        if (!event.getHost().getEmail().equals(email)) {
            throw new RuntimeException("Only the host can modify permissions");
        }
        if (event.getHost().getId().equals(userId)) {
            throw new RuntimeException("Host cannot modify their own constraints");
        }
        
        EventMember member = eventMemberRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        member.setCanAssignTasks(canAssignTasks);
        eventMemberRepository.save(member);
        
        activityLogService.logActivity(eventId, "Updated permissions for " + member.getUser().getName(), event.getHost().getName());
    }

    private InviteResponse mapToResponse(EventMember member) {
        return new InviteResponse(
                member.getId(),
                member.getEvent().getId(),
                member.getUser().getId(),
                member.getUser().getName(),
                member.getUser().getEmail(),
                member.getRole(),
                member.getStatus(),
                member.isCanAssignTasks()
        );
    }
}
