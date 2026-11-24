package com.notesapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Notes App backend.
 *
 * <p>{@link UserDetailsServiceAutoConfiguration} is excluded because this app
 * authenticates with JWT and has no {@code UserDetailsService}; without the
 * exclusion Spring Boot would generate an unused in-memory user and log a
 * random security password on every startup.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableCaching
public class NotesAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotesAppApplication.class, args);
    }
}