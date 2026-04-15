package com.eventsync.service;

import com.eventsync.dto.CommentRequest;
import com.eventsync.dto.CommentResponse;
import com.eventsync.model.Comment;
import com.eventsync.model.Event;
import com.eventsync.model.User;
import com.eventsync.repository.CommentRepository;
import com.eventsync.repository.EventRepository;
import com.eventsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final CollaborationService collaborationService;

    public CommentResponse addComment(Long eventId, CommentRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow();

        if (!collaborationService.isAcceptedMemberOrHost(eventId, currentUser.getId())) {
             throw new RuntimeException("Wait, you must be a validated member to establish discussion records!");
        }

        Event event = eventRepository.findById(eventId).orElseThrow();

        Comment comment = Comment.builder()
                .event(event)
                .user(currentUser)
                .message(request.message())
                .createdAt(LocalDateTime.now())
                .build();

        comment = commentRepository.save(comment);

        return mapToResponse(comment);
    }

    public List<CommentResponse> getComments(Long eventId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow();

        if (!collaborationService.isAcceptedMemberOrHost(eventId, currentUser.getId())) {
             throw new RuntimeException("Unauthorized Access");
        }

        return commentRepository.findByEventIdOrderByCreatedAtAsc(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getEvent().getId(),
                comment.getUser().getId(),
                comment.getUser().getName(),
                comment.getMessage(),
                comment.getCreatedAt()
        );
    }
}
