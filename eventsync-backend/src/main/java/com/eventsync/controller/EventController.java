package com.eventsync.controller;

import com.eventsync.dto.EventRequest;
import com.eventsync.dto.EventResponse;
import com.eventsync.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<EventResponse> createEvent(@RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.createEvent(request));
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> getMyEvents() {
        return ResponseEntity.ok(eventService.getMyEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEvent(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<EventResponse> completeEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.completeEvent(id));
    }
}
