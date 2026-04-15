package com.eventsync.controller;

import com.eventsync.dto.TaskRequest;
import com.eventsync.dto.TaskResponse;
import com.eventsync.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/event/{eventId}")
    public ResponseEntity<TaskResponse> createTask(@PathVariable Long eventId, @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(eventId, request));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<TaskResponse>> getTasksForEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(taskService.getTasksForEvent(eventId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        return ResponseEntity.ok(taskService.getMyTasks());
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTaskStatus(@PathVariable Long taskId, @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, request));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}
