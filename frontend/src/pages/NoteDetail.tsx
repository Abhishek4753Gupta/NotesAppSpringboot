import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { deleteNote, getNote, togglePin, updateNote } from '../api/notes'
import { getErrorMessage } from '../lib/axios'
import { NoteModal } from '../components/NoteModal'
import type { Note, NoteRequest } from '../types'

export function NoteDetail() {
  const { id } = useParams<{ id: string }>()
  const noteId = Number(id)
  const navigate = useNavigate()

  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const load = useCallback(() => {
    if (!Number.isFinite(noteId)) {
      setError('Invalid note id')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getNote(noteId)
      .then(setNote)
      .catch((err: unknown) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [noteId])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (payload: NoteRequest) => {
    try {
      const updated = await updateNote(noteId, payload)
      setNote(updated)
      toast.success('Note updated')
      setEditing(false)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  }

  const handleTogglePin = async () => {
    try {
      const updated = await togglePin(noteId)
      setNote(updated)
      toast.success(updated.pinned ? 'Note pinned' : 'Note unpinned')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!note) return
    if (!window.confirm(`Delete "${note.title}"?`)) return
    try {
      await deleteNote(noteId)
      toast.success('Note deleted')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return <p className="loading">Loading...</p>

  if (error || !note) {
    return (
      <div className="empty-state">
        <p>{error ?? 'Note not found'}</p>
        <Link to="/" className="btn">
          Back to notes
        </Link>
      </div>
    )
  }

  const created = new Date(note.createdAt).toLocaleString()
  const updated = new Date(note.updatedAt).toLocaleString()

  return (
    <article className="note-detail">
      <header className="note-detail-header">
        <Link to="/" className="note-detail-back">
          &larr; Back to notes
        </Link>
        <div className="note-detail-actions">
          <button
            type="button"
            className={`btn ${note.pinned ? 'btn-primary' : ''}`}
            onClick={handleTogglePin}
          >
            {note.pinned ? '\u2605 Pinned' : '\u2606 Pin'}
          </button>
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </header>

      <div className="note-detail-body" style={{ backgroundColor: note.color }}>
        <h1 className="note-detail-title">{note.title}</h1>
        <div className="note-detail-content">
          {note.content?.trim() ? note.content : <em>No content</em>}
        </div>
      </div>

      <footer className="note-detail-footer">
        <span>Created {created}</span>
        {updated !== created && <span>Updated {updated}</span>}
      </footer>

      {editing && (
        <NoteModal
          note={note}
          onClose={() => setEditing(false)}
          onSave={handleSave}
        />
      )}
    </article>
  )
}