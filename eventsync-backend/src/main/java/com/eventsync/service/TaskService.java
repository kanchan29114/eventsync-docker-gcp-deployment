package com.eventsync.service;

import com.eventsync.dto.TaskRequest;
import com.eventsync.dto.TaskResponse;
import com.eventsync.model.Event;
import com.eventsync.model.Task;
import com.eventsync.model.User;
import com.eventsync.repository.EventRepository;
import com.eventsync.repository.TaskRepository;
import com.eventsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    @Lazy private final CollaborationService collaborationService;
    private final ActivityLogService activityLogService;

    public TaskResponse createTask(Long eventId, TaskRequest request) {
        User currentUser = getCurrentUser();

        // Only host or ACCEPTED members can create tasks
        if (!collaborationService.isAcceptedMemberOrHost(eventId, currentUser.getId())) {
            throw new RuntimeException("You must be an accepted member to add tasks.");
        }

        Event event = eventRepository.findById(eventId).orElseThrow();
        List<User> assignees = new ArrayList<>();
        if (request.assigneeIds() != null && !request.assigneeIds().isEmpty()) {
            if (!collaborationService.canAssignTasks(eventId, currentUser.getId())) {
                throw new RuntimeException("User does not have permission to assign tasks");
            }
            for (Long aId : request.assigneeIds()) {
                if (!collaborationService.isAcceptedMemberOrHost(eventId, aId)) {
                    throw new RuntimeException("Only accepted members can be assigned tasks");
                }
                userRepository.findById(aId).ifPresent(assignees::add);
            }
        }

        Task task = Task.builder()
                .event(event)
                .title(request.title())
                .status(request.status())
                .assignees(assignees)
                .dueDate(request.dueDate())
                .build();

        task = taskRepository.save(task);
        
        String assignedNames = assignees.isEmpty() ? "" : " and assigned to " + assignees.stream().map(User::getName).collect(Collectors.joining(", "));
        activityLogService.logActivity(eventId, "Task '" + task.getTitle() + "' created" + assignedNames, currentUser.getName());
        
        return mapToResponse(task);
    }

    public List<TaskResponse> getTasksForEvent(Long eventId) {
        return taskRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getMyTasks() {
        User currentUser = getCurrentUser();
        return taskRepository.findByAssigneesIdOrderByDueDateAsc(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse updateTaskStatus(Long taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        User currentUser = getCurrentUser();

        // Only host or Assigned members can update tasks
        boolean isHost = task.getEvent().getHost().getId().equals(currentUser.getId());
        boolean isAssignee = task.getAssignees() != null && task.getAssignees().stream().anyMatch(a -> a.getId().equals(currentUser.getId()));
        if (!(isHost || isAssignee)) {
            throw new RuntimeException("Only assigned user or HOST can update status");
        }

        task.setStatus(request.status());
        if (request.assigneeIds() != null) {
            if (!collaborationService.canAssignTasks(task.getEvent().getId(), currentUser.getId())) {
                throw new RuntimeException("User does not have permission to assign tasks");
            }
            List<User> newAssignees = new ArrayList<>();
            for (Long aId : request.assigneeIds()) {
                if (!collaborationService.isAcceptedMemberOrHost(task.getEvent().getId(), aId)) {
                    throw new RuntimeException("Only accepted members can be assigned tasks");
                }
                userRepository.findById(aId).ifPresent(newAssignees::add);
            }
            task.setAssignees(newAssignees);
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }
        task = taskRepository.save(task);
        
        String actionStr = request.status().name().equals("COMPLETED") ? "completed" : "updated";
        activityLogService.logActivity(task.getEvent().getId(), "Task '" + task.getTitle() + "' " + actionStr, currentUser.getName());
        
        return mapToResponse(task);
    }

    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    private TaskResponse mapToResponse(Task task) {
        List<Map<String, Object>> assigneeMapList = new ArrayList<>();
        if (task.getAssignees() != null) {
            for (User u : task.getAssignees()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getId());
                map.put("name", u.getName());
                assigneeMapList.add(map);
            }
        }
        return new TaskResponse(
                task.getId(),
                task.getEvent().getId(),
                task.getEvent().getTitle(),
                task.getTitle(),
                task.getStatus().name(),
                assigneeMapList,
                task.getDueDate()
        );
    }
}

