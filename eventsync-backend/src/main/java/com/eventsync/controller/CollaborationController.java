package com.eventsync.controller;

import com.eventsync.dto.InviteRequest;
import com.eventsync.dto.InviteResponse;
import com.eventsync.dto.PermissionRequest;
import com.eventsync.model.MemberStatus;
import com.eventsync.service.CollaborationService;
import com.eventsync.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.eventsync.model.EventMember;
import com.eventsync.repository.EventMemberRepository;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CollaborationController {

    private final CollaborationService collaborationService;
    private final EventMemberRepository eventMemberRepository;
    private final ActivityLogService activityLogService;

    // Invite a user to an event
    @PostMapping("/collaboration/event/{eventId}/invite")
    public ResponseEntity<InviteResponse> inviteUser(@PathVariable Long eventId, @RequestBody InviteRequest request) {
        return ResponseEntity.ok(collaborationService.inviteUser(eventId, request));
    }

    // Get all members of an event
    @GetMapping("/collaboration/event/{eventId}/members")
    public ResponseEntity<List<InviteResponse>> getEventMembers(@PathVariable Long eventId) {
        return ResponseEntity.ok(collaborationService.getEventMembers(eventId));
    }

    // Get all pending invitations for the currently logged-in user
    @GetMapping("/invitations")
    public ResponseEntity<List<InviteResponse>> getMyPendingInvitations() {
        return ResponseEntity.ok(collaborationService.getMyPendingInvitations());
    }

    // Accept an invitation (POST for logged in app)
    @PostMapping("/invitations/{inviteId}/accept")
    public ResponseEntity<InviteResponse> acceptInvitation(@PathVariable Long inviteId) {
        return ResponseEntity.ok(collaborationService.updateInviteStatus(inviteId, MemberStatus.ACCEPTED));
    }

    // Accept an invitation via GET (From Email Link)
    @GetMapping("/invitations/{inviteId}/accept")
    public ResponseEntity<String> acceptInvitationFromEmail(@PathVariable Long inviteId) {
        Optional<EventMember> optional = eventMemberRepository.findById(inviteId);
        
        if (optional.isEmpty()) {
            String html = "<html><body style='font-family:sans-serif; text-align:center; padding-top: 50px;'>" +
                          "<h1 style='color: #dc3545;'>❌ Invitation not found or revoked</h1>" +
                          "<p>This invitation is no longer valid or has been revoked.</p>" +
                          "</body></html>";
            return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
        }
        
        EventMember member = optional.orElse(null);
        if (member != null && member.getStatus() != MemberStatus.PENDING) {
            String html = "<html><body style='font-family:sans-serif; text-align:center; padding-top: 50px;'>" +
                          "<h1 style='color: #ffc107;'>⚠️ Invitation already processed</h1>" +
                          "<p>This invitation has already been responded to.</p>" +
                          "</body></html>";
            return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
        }

        member.setStatus(MemberStatus.ACCEPTED);
        eventMemberRepository.save(member);
        activityLogService.logActivity(member.getEvent().getId(), member.getUser().getName() + " accepted invitation", member.getUser().getName());
        
        String html = "<html><body style='font-family:sans-serif; text-align:center; padding-top: 50px;'>" +
                      "<h1 style='color: #28a745;'>✅ Invitation Accepted</h1>" +
                      "<p>You can now close this window and access the event dashboard.</p>" +
                      "</body></html>";
        return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
    }

    // Reject an invitation (POST for logged in app)
    @PostMapping("/invitations/{inviteId}/reject")
    public ResponseEntity<InviteResponse> rejectInvitation(@PathVariable Long inviteId) {
        return ResponseEntity.ok(collaborationService.updateInviteStatus(inviteId, MemberStatus.REJECTED));
    }

    // Reject an invitation via GET (From Email Link)
    @GetMapping("/invitations/{inviteId}/reject")
    public ResponseEntity<String> rejectInvitationFromEmail(@PathVariable Long inviteId) {
        Optional<EventMember> optional = eventMemberRepository.findById(inviteId);
        
        if (optional.isEmpty()) {
            String html = "<html><body style='font-family:sans-serif; text-align:center; padding-top: 50px;'>" +
                          "<h1 style='color: #dc3545;'>❌ Invitation not found or revoked</h1>" +
                          "<p>This invitation is no longer valid or has been revoked.</p>" +
                          "</body></html>";
            return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
        }
        
        EventMember member = optional.orElse(null);
        if (member != null && member.getStatus() != MemberStatus.PENDING) {
            String html = "<html><body style='font-family:sans-serif; text-align:center; padding-top: 50px;'>" +
                          "<h1 style='color: #ffc107;'>⚠️ Invitation already processed</h1>" +
                          "<p>This invitation has already been responded to.</p>" +
                          "</body></html>";
            return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
        }

        member.setStatus(MemberStatus.REJECTED);
        eventMemberRepository.save(member);
        activityLogService.logActivity(member.getEvent().getId(), member.getUser().getName() + " rejected invitation", member.getUser().getName());
        
        String html = "<html><body style='font-family:sans-serif; text-align:center; padding-top: 50px;'>" +
                      "<h1 style='color: #28a745;'>✅ Invitation Rejected</h1>" +
                      "<p>You have successfully declined the invitation. You can close this window.</p>" +
                      "</body></html>";
        return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
    }

    // Host removes a member from their event
    @DeleteMapping("/events/{eventId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long eventId, @PathVariable Long userId) {
        collaborationService.removeMember(eventId, userId);
        return ResponseEntity.noContent().build();
    }
    
    // Update a member's per-module functional permissions
    @PutMapping("/events/{eventId}/members/{userId}/permissions")
    public ResponseEntity<Void> updateMemberPermissions(
            @PathVariable Long eventId, 
            @PathVariable Long userId, 
            @RequestBody PermissionRequest request) {
        collaborationService.updateMemberPermissions(eventId, userId, request.canAssignTasks());
        return ResponseEntity.ok().build();
    }
}
