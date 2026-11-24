package com.notesapp.security;

import com.notesapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository userRepository;

    public Long getId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new IllegalStateException("No authenticated user in context");
        }
        // Validate the user still exists (guards against stale tokens)
        if (!userRepository.existsById(userId)) {
            throw new IllegalStateException("Authenticated user no longer exists");
        }
        return userId;
    }
}