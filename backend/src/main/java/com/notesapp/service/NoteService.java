package com.notesapp.service;

import com.notesapp.dto.NoteRequest;
import com.notesapp.dto.NoteResponse;
import com.notesapp.dto.PageResponse;
import com.notesapp.entity.Note;
import com.notesapp.entity.User;
import com.notesapp.exception.ResourceNotFoundException;
import com.notesapp.repository.NoteRepository;
import com.notesapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    /** 6 notes per page, as required. */
    private static final int PAGE_SIZE = 6;

    // ───────────────────────────────────────────────────────────
    //  READ
    // ───────────────────────────────────────────────────────────

    @Cacheable(value = "notes", key = "#userId + ':' + #page + ':' + #size",
            unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<NoteResponse> getNotes(Long userId, int page, int size) {
        int safeSize = size > 0 ? size : PAGE_SIZE;
        Pageable pageable = PageRequest.of(page, safeSize);
        Page<Note> notePage = noteRepository
                .findByUserIdOrderByPinnedDescUpdatedAtDesc(userId, pageable);
        return toPageResponse(notePage, page, safeSize);
    }

    @Cacheable(value = "search", key = "#userId + ':' + #title + ':' + #page + ':' + #size",
            unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<NoteResponse> searchByTitle(Long userId, String title, int page, int size) {
        int safeSize = size > 0 ? size : PAGE_SIZE;
        Pageable pageable = PageRequest.of(page, safeSize);
        Page<Note> notePage = noteRepository.searchByTitlePrefix(userId, title, pageable);
        return toPageResponse(notePage, page, safeSize);
    }

    @Cacheable(value = "suggestions", key = "#userId + ':' + #query",
            unless = "#result == null")
    @Transactional(readOnly = true)
    public List<String> suggestTitles(Long userId, String query) {
        if (query == null || query.length() < 2) {
            return List.of();
        }
        return noteRepository.suggestTitles(userId, query, 8).stream()
                .map(row -> (String) row[1]) // row[1] is the title column
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoteResponse getById(Long userId, Long noteId) {
        return NoteResponse.from(findOwned(userId, noteId));
    }

    // ───────────────────────────────────────────────────────────
    //  WRITE
    // ───────────────────────────────────────────────────────────

    @Caching(evict = {
            @CacheEvict(value = "notes", allEntries = true),
            @CacheEvict(value = "search", allEntries = true),
            @CacheEvict(value = "suggestions", allEntries = true)
    })
    @Transactional
    public NoteResponse create(Long userId, NoteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Note note = Note.builder()
                .title(request.title().trim())
                .content(request.content())
                .color(request.color() != null ? request.color() : "#ffffff")
                .pinned(Boolean.TRUE.equals(request.pinned()))
                .user(user)
                .build();
        return NoteResponse.from(noteRepository.save(note));
    }

    @Caching(evict = {
            @CacheEvict(value = "notes", allEntries = true),
            @CacheEvict(value = "search", allEntries = true),
            @CacheEvict(value = "suggestions", allEntries = true)
    })
    @Transactional
    public NoteResponse update(Long userId, Long noteId, NoteRequest request) {
        Note note = findOwned(userId, noteId);
        note.setTitle(request.title().trim());
        note.setContent(request.content());
        if (request.color() != null) note.setColor(request.color());
        if (request.pinned() != null) note.setPinned(request.pinned());
        // saveAndFlush so @PreUpdate runs before the response is built,
        // otherwise the returned updatedAt would be the pre-update value.
        return NoteResponse.from(noteRepository.saveAndFlush(note));
    }

    @Caching(evict = {
            @CacheEvict(value = "notes", allEntries = true),
            @CacheEvict(value = "search", allEntries = true),
            @CacheEvict(value = "suggestions", allEntries = true)
    })
    @Transactional
    public void delete(Long userId, Long noteId) {
        Note note = findOwned(userId, noteId);
        noteRepository.delete(note);
    }

    @Caching(evict = {
            @CacheEvict(value = "notes", allEntries = true),
            @CacheEvict(value = "search", allEntries = true),
            @CacheEvict(value = "suggestions", allEntries = true)
    })
    @Transactional
    public NoteResponse togglePin(Long userId, Long noteId) {
        Note note = findOwned(userId, noteId);
        note.setPinned(!note.isPinned());
        // saveAndFlush so @PreUpdate runs before the response is built.
        return NoteResponse.from(noteRepository.saveAndFlush(note));
    }

    // ───────────────────────────────────────────────────────────
    //  HELPERS
    // ───────────────────────────────────────────────────────────

    private Note findOwned(Long userId, Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        if (!note.getUser().getId().equals(userId)) {
            // Do not leak existence to non-owners
            throw new ResourceNotFoundException("Note not found");
        }
        return note;
    }

    private PageResponse<NoteResponse> toPageResponse(Page<Note> page, int pageNo, int size) {
        List<NoteResponse> content = page.getContent().stream()
                .map(NoteResponse::from)
                .collect(Collectors.toList());
        return new PageResponse<>(
                content,
                pageNo,
                size,
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }
}