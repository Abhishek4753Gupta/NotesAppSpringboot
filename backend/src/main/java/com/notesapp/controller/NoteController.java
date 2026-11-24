package com.notesapp.controller;

import com.notesapp.dto.NoteRequest;
import com.notesapp.dto.NoteResponse;
import com.notesapp.dto.PageResponse;
import com.notesapp.security.CurrentUser;
import com.notesapp.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final CurrentUser currentUser;

    /** List notes for the current user with pagination (6 per page by default). */
    @GetMapping
    public ResponseEntity<PageResponse<NoteResponse>> getNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        return ResponseEntity.ok(noteService.getNotes(currentUser.getId(), page, size));
    }

    /** Search notes by title prefix with pagination. */
    @GetMapping("/search")
    public ResponseEntity<PageResponse<NoteResponse>> search(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        return ResponseEntity.ok(noteService.searchByTitle(currentUser.getId(), title, page, size));
    }

    /** Autocomplete suggestions for a partially typed title. */
    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> suggestions(@RequestParam String query) {
        return ResponseEntity.ok(noteService.suggestTitles(currentUser.getId(), query));
    }

    /** Get a single note (ownership-checked). */
    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(noteService.getById(currentUser.getId(), id));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(@Valid @RequestBody NoteRequest request) {
        NoteResponse created = noteService.create(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(noteService.update(currentUser.getId(), id, request));
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<NoteResponse> togglePin(@PathVariable Long id) {
        return ResponseEntity.ok(noteService.togglePin(currentUser.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        noteService.delete(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }
}