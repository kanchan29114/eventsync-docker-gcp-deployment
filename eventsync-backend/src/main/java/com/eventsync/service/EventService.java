package com.eventsync.service;

import com.eventsync.dto.EventRequest;
import com.eventsync.dto.EventResponse;
import com.eventsync.model.Event;
import com.eventsync.model.EventStatus;
import com.eventsync.model.Task;
import com.eventsync.model.User;
import com.eventsync.repository.EventRepository;
import com.eventsync.repository.UserRepository;
import com.eventsync.repository.TaskRepository;
import com.eventsync.repository.EventMemberRepository;
import com.eventsync.repository.CommentRepository;
import com.eventsync.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final EventMemberRepository eventMemberRepository;
    private final CommentRepository commentRepository;
    private final ActivityLogRepository activityLogRepository;

    public EventResponse createEvent(EventRequest request) {
        User currentUser = getCurrentUser();
        Event event = Event.builder()
                .title(request.title())
                .description(request.description())
                .date(request.date())
                .location(request.location())
                .budget(request.budget())
                .host(currentUser)
                .build();
        event = eventRepository.save(event);
        return mapToResponse(event);
    }

    public List<EventResponse> getMyEvents() {
        User currentUser = getCurrentUser();

        // Fetch events hosted by the current user
        List<Event> hostedEvents = eventRepository.findByHostId(currentUser.getId());

        // Fetch events where the current user was invited
        List<Event> invitedEvents = eventRepository.findInvitedEventsByUserId(currentUser.getId());

        // Merge both lists, de-duplicating by event ID (host might also be in members table)
        Map<Long, Event> uniqueEvents = new LinkedHashMap<>();
        for (Event e : hostedEvents) uniqueEvents.put(e.getId(), e);
        for (Event e : invitedEvents) uniqueEvents.put(e.getId(), e);

        return uniqueEvents.values().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public EventResponse getEvent(Long id) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        return mapToResponse(event);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id).orElseThrow();
        if (!event.getHost().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Not authorized to delete");
        }
        
        List<Task> tasks = taskRepository.findByEventId(id);
        taskRepository.deleteAll(tasks);
        
        eventMemberRepository.deleteByEventId(id);
        commentRepository.deleteByEventId(id);
        activityLogRepository.deleteByEventId(id);
        
        eventRepository.delete(event);
    }

    @org.springframework.transaction.annotation.Transactional
    public EventResponse completeEvent(Long id) {
        Event event = eventRepository.findById(id).orElseThrow();
        if (!event.getHost().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Not authorized to complete event");
        }
        event.setStatus(EventStatus.COMPLETED);
        event = eventRepository.save(event);
        return mapToResponse(event);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    private EventResponse mapToResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getDate(),
                event.getLocation(),
                event.getBudget(),
                event.getHost().getId(),
                event.getHost().getName(),
                event.getHost().getEmail(),
                event.getStatus().name()
        );
    }
}
