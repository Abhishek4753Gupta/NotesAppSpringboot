import { useEffect, useState, type FormEvent } from 'react'
import type { Note, NoteRequest } from '../types'

interface NoteModalProps {
  note: Note | null
  onClose: () => void
  onSave: (payload: NoteRequest) => Promise<void>
}

const COLORS = ['#ffffff', '#fff3cd', '#d1ecf1', '#d4edda', '#f8d7da', '#e2e3ff']

export function NoteModal({ note, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [color, setColor] = useState(note?.color ?? COLORS[0])
  const [pinned, setPinned] = useState(note?.pinned ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
    setColor(note?.color ?? COLORS[0])
    setPinned(note?.pinned ?? false)
  }, [note])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({ title: title.trim(), content, color, pinned })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{note ? 'Edit Note' : 'Create Note'}</h2>
        <form onSubmit={handleSubmit} className="note-form">
          <label className="form-field">
            <span>Title</span>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label className="form-field">
            <span>Content</span>
            <textarea
              className="form-input form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Color</span>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'is-selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </label>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <span>Pinned</span>
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}