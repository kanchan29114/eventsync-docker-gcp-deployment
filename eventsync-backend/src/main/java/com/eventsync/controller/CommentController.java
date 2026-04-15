package com.eventsync.controller;

import com.eventsync.dto.CommentRequest;
import com.eventsync.dto.CommentResponse;
import com.eventsync.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long eventId, @RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.addComment(eventId, request));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long eventId) {
        return ResponseEntity.ok(commentService.getComments(eventId));
    }
}
