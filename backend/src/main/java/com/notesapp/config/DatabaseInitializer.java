package com.notesapp.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time, idempotent database setup that runs on startup.
 *
 * 1. Enables the pg_trgm extension (needed by the suggestions API).
 * 2. Creates a GIN trigram index on notes.title for fast similarity search.
 *
 * Both statements use IF NOT EXISTS so they are safe to run on every boot.
 * (Hibernate's ddl-auto=update cannot create GIN trigram indexes.)
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DatabaseInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_notes_title_trgm " +
                    "ON notes USING gin (title gin_trgm_ops)");
            log.info("pg_trgm extension + trigram index ready");
        } catch (Exception e) {
            log.warn("Could not initialize pg_trgm (search suggestions may be unavailable): {}",
                    e.getMessage());
        }
    }
}