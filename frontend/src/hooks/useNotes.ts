import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getNotes, searchNotes } from '../api/notes'
import { getErrorMessage } from '../lib/axios'
import type { Note, PageResponse } from '../types'

export const PAGE_SIZE = 6

interface UseNotesOptions {
  /** When set, the hook performs a title search instead of listing all notes. */
  query?: string
}

interface UseNotesResult {
  pageData: PageResponse<Note> | null
  page: number
  setPage: (page: number) => void
  loading: boolean
  error: string | null
  /** Refetch the current page (after a create/update/delete). */
  reload: () => void
}

/**
 * Loads one page of notes, either the full list or a title search.
 *
 * Errors surface through react-hot-toast directly rather than an `onError`
 * callback. A callback prop would be a fresh reference on every render, and
 * since a completed fetch always produces a new `pageData` object (triggering
 * a re-render), the effect below would re-run forever and hammer the API.
 *
 * `reload` is a counter rather than a boolean for the same reason: a boolean
 * would stay `true` and never re-fire on a second mutation.
 */
export function useNotes({ query = '' }: UseNotesOptions = {}): UseNotesResult {
  const [pageData, setPageData] = useState<PageResponse<Note> | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const term = query.trim()

    setLoading(true)
    setError(null)

    const request = term
      ? searchNotes(term, { page, size: PAGE_SIZE })
      : getNotes({ page, size: PAGE_SIZE })

    request
      .then((data) => {
        if (cancelled) return
        setPageData(data)
        // If the page no longer exists (e.g. the last note on the final page
        // was deleted), step back to the new last page.
        if (data.totalPages > 0 && page >= data.totalPages) {
          setPage(data.totalPages - 1)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = getErrorMessage(err)
        setError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, query, reloadToken])

  return { pageData, page, setPage, loading, error, reload }
}