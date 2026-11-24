import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  createNote,
  deleteNote,
  getSuggestions,
  togglePin,
  updateNote,
} from '../api/notes'
import { getErrorMessage } from '../lib/axios'
import { useDebounce } from '../hooks/useDebounce'
import { useNotes } from '../hooks/useNotes'
import { NoteModal } from '../components/NoteModal'
import { NotesGrid } from '../components/NotesGrid'
import type { Note, NoteRequest } from '../types'

export function Notes() {
  const navigate = useNavigate()
  const { pageData, setPage, loading, error, reload } = useNotes()

  // Modal state: null = closed, 'new' = creating, Note = editing
  const [editing, setEditing] = useState<Note | 'new' | null>(null)

  // ── Search box (suggestions only; Enter/button navigates to /search) ──
  const [term, setTerm] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedTerm = useDebounce(term, 300)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const value = debouncedTerm.trim()
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    let cancelled = false
    getSuggestions(value)
      .then((results) => {
        if (cancelled) return
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      })
      .catch(() => {
        if (!cancelled) setSuggestions([])
      })
    return () => {
      cancelled = true
    }
  }, [debouncedTerm])

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const goToSearch = (value: string) => {
    setShowSuggestions(false)
    const trimmed = value.trim()
    navigate(trimmed ? `/search?title=${encodeURIComponent(trimmed)}` : '/search')
  }

  // ── Mutations ──
  const handleSave = async (payload: NoteRequest) => {
    try {
      if (editing === 'new') {
        await createNote(payload)
        toast.success('Note created')
        setEditing(null)
        reload()
      } else if (editing) {
        await updateNote(editing.id, payload)
        toast.success('Note updated')
        setEditing(null)
        reload()
      }
    } catch (err) {
      // NoteModal shows the message inline; rethrow so it stays visible there.
      throw new Error(getErrorMessage(err))
    }
  }

  const handleDelete = async (note: Note) => {
    if (!window.confirm(`Delete "${note.title}"?`)) return
    try {
      await deleteNote(note.id)
      toast.success('Note deleted')
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleTogglePin = async (note: Note) => {
    try {
      const updated = await togglePin(note.id)
      toast.success(updated.pinned ? 'Note pinned' : 'Note unpinned')
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="notes-page">
      <div className="notes-toolbar">
        <div className="search-bar" ref={boxRef}>
          <input
            type="text"
            className="search-input"
            placeholder="Search notes by title..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                goToSearch(term)
              }
              if (e.key === 'Escape') setShowSuggestions(false)
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((title) => (
                <li
                  key={title}
                  className="suggestion-item"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setTerm(title)
                    goToSearch(title)
                  }}
                >
                  {title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" className="btn btn-primary" onClick={() => goToSearch(term)}>
          Search
        </button>
        <button
          type="button"
          className="btn btn-primary new-note-btn"
          onClick={() => setEditing('new')}
        >
          + New Note
        </button>
      </div>

      {error && <p className="page-error">{error}</p>}

      {pageData ? (
        <NotesGrid
          pageData={pageData}
          loading={loading}
          onEdit={setEditing}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
          onPageChange={setPage}
        />
      ) : (
        loading && <p className="loading">Loading...</p>
      )}

      {editing && (
        <NoteModal
          note={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}