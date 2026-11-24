import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Note } from '../types'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
  onTogglePin: (note: Note) => void
}

export function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  const navigate = useNavigate()
  const updated = new Date(note.updatedAt).toLocaleString()

  // Card click opens the full-page reader; the buttons below stop propagation
  // so they don't also navigate.
  const openNote = () => navigate(`/notes/${note.id}`)

  const handleCardKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openNote()
    }
  }

  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div
      className="note-card"
      style={{ backgroundColor: note.color }}
      role="button"
      tabIndex={0}
      onClick={openNote}
      onKeyDown={handleCardKey}
      aria-label={`Open note: ${note.title}`}
    >
      <div className="note-card-header">
        <h3 className="note-title">{note.title}</h3>
        <button
          type="button"
          className={`pin-btn ${note.pinned ? 'is-pinned' : ''}`}
          onClick={stop(() => onTogglePin(note))}
          title={note.pinned ? 'Unpin' : 'Pin'}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
        >
          {note.pinned ? '\u2605' : '\u2606'}
        </button>
      </div>
      <p className="note-content">{note.content || 'No content'}</p>
      <div className="note-card-footer">
        <span className="note-date">{updated}</span>
        <div className="note-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={stop(() => onEdit(note))}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={stop(() => onDelete(note))}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}