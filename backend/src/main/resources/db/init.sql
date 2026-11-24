-- ─────────────────────────────────────────────────────────────
-- One-time PostgreSQL (Supabase) setup for the Notes App.
-- Run this once against your database (e.g. in the Supabase SQL editor).
-- ─────────────────────────────────────────────────────────────

-- Enable trigram similarity search (required by the suggestions API).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index on the note title to make `similarity()` / `%` fast.
-- (Hibernate's ddl-auto=update cannot create this index for us.)
CREATE INDEX IF NOT EXISTS idx_notes_title_trgm
    ON notes USING gin (title gin_trgm_ops);