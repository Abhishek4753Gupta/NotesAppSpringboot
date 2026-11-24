import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { deleteNote, togglePin, updateNote, createNote } from '../api/notes'
import { getErrorMessage } from '../lib/axios'
import { useNotes } from '../hooks/useNotes'
import { NotesGrid } from '../components/NotesGrid'
import { NoteModal } from '../components/NoteModal'
import type { Note, NoteRequest } from '../types'

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Query and page live in the URL so browser back/forward and reloads work.
  const title = searchParams.get('title') ?? ''
  const rawPage = Number(searchParams.get('page') ?? '0')
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 0

  const [editing, setEditing] = useState<Note | 'new' | null>(null)

  const { pageData, loading, error, reload } = useNotes({ query: title })

  const updateParams = (next: { title?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams)
    if (next.title !== undefined) {
      if (next.title.trim()) params.set('title', next.title.trim())
      else params.delete('title')
    }
    if (next.page !== undefined) {
      if (next.page > 0) params.set('page', String(next.page))
      else params.delete('page')
    }
    setSearchParams(params, { replace: next.page === undefined })
  }

  const handlePageChange = (nextPage: number) => updateParams({ page: nextPage })

  const handleSave = async (payload: NoteRequest) => {
    try {
      if (editing === 'new') {
        await createNote(payload)
        toast.success('Note created')
      } else if (editing) {
        await updateNote(editing.id, payload)
        toast.success('Note updated')
      }
      setEditing(null)
      reload()
    } catch (err) {
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

  const totalPages = pageData?.totalPages ?? 0
  const currentPage = pageData?.page ?? page
  const totalElements = pageData?.totalElements ?? 0

  return (
    <div className="notes-page">
      <div className="search-summary">
        <h1 className="search-heading">
          {title ? (
            <>
              Results for &quot;{title}&quot;
            </>
          ) : (
            'All notes'
          )}
        </h1>
        <p className="search-meta">
          {loading
            ? 'Searching...'
            : `${totalElements} note${totalElements === 1 ? '' : 's'} found`}
        </p>
      </div>

      {error && <p className="page-error">{error}</p>}

      {pageData ? (
        <NotesGrid
          pageData={pageData}
          loading={loading}
          query={title}
          onEdit={setEditing}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
          onPageChange={handlePageChange}
        />
      ) : (
        loading && <p className="loading">Searching...</p>
      )}

      {!loading && totalPages > 0 && (
        <p className="pagination-info">
          Page {currentPage + 1} of {totalPages}
        </p>
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