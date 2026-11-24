package com.notesapp.repository;

import com.notesapp.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    Page<Note> findByUserIdOrderByPinnedDescUpdatedAtDesc(Long userId, Pageable pageable);

    @Query("""
            select n from Note n
            where n.user.id = :userId
              and lower(n.title) like lower(concat(:title, '%'))
            order by n.pinned desc, n.updatedAt desc
            """)
    Page<Note> searchByTitlePrefix(@Param("userId") Long userId,
                                   @Param("title") String title,
                                   Pageable pageable);

    /**
     * Suggestion query using PostgreSQL pg_trgm similarity.
     *
     * <p>Matching is case-insensitive and ranked so that autocomplete feels natural:
     * <ol>
     *   <li>exact title match</li>
     *   <li>titles that start with the query (prefix)</li>
     *   <li>remaining typo-tolerant trigram matches</li>
     * </ol>
     *
     * <p>A low similarity threshold (0.15) is used instead of the default 0.3
     * because short prefixes compared against long titles score low under
     * trigram similarity (e.g. {@code 'groc'} vs {@code 'Grocery reminders'}).
     *
     * <p>Returns up to {@code limit} rows of {@code (id, title)}.
     * Requires the pg_trgm extension (created by {@code DatabaseInitializer}).
     */
    @Query(value = """
            select id, title,
                   similarity(lower(title), lower(:query)) as sim
            from notes
            where user_id = :userId
              and (
                    lower(title) like lower(concat(:query, '%'))
                 or similarity(lower(title), lower(:query)) >= 0.15
              )
            order by (lower(title) = lower(:query)) desc,
                     (lower(title) like lower(concat(:query, '%'))) desc,
                     sim desc,
                     title asc
            limit :limit
            """, nativeQuery = true)
    List<Object[]> suggestTitles(@Param("userId") Long userId,
                                 @Param("query") String query,
                                 @Param("limit") int limit);
}