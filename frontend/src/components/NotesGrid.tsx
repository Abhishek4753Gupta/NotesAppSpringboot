import type { Note, PageResponse } from '../types'
import { NoteCard } from './NoteCard'
import { Pagination } from './Pagination'

interface NotesGridProps {
  pageData: PageResponse<Note>
  loading: boolean
  /** Text used to describe the current result set (empty for the default list). */
  query?: string
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
  onTogglePin: (note: Note) => void
  onPageChange: (page: number) => void
}

export function NotesGrid({
  pageData,
  loading,
  query = '',
  onEdit,
  onDelete,
  onTogglePin,
  onPageChange,
}: NotesGridProps) {
  const trimmed = query.trim()

  if (loading) {
    return <p className="loading">Loading...</p>
  }

  if (pageData.content.length === 0) {
    return (
      <div className="empty-state">
        {trimmed ? (
          <p>No notes matching &quot;{trimmed}&quot;</p>
        ) : (
          <p>No notes yet. Create your first note!</p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="notes-grid">
        {pageData.content.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
      <Pagination
        page={pageData.page}
        totalPages={pageData.totalPages}
        onPageChange={onPageChange}
      />
      <p className="pagination-info">
        Showing {pageData.content.length} of {pageData.totalElements} notes
        {trimmed ? ` matching "${trimmed}"` : ''}
      </p>
    </>
  )
}