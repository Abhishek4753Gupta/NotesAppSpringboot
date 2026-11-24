import api from '../lib/axios'
import type { Note, NoteRequest, PageResponse } from '../types'

export interface ListParams {
  page: number
  size: number
}

export async function getNotes(params: ListParams): Promise<PageResponse<Note>> {
  const { data } = await api.get<PageResponse<Note>>('/notes', { params })
  return data
}

export async function searchNotes(
  title: string,
  params: ListParams,
): Promise<PageResponse<Note>> {
  const { data } = await api.get<PageResponse<Note>>('/notes/search', {
    params: { title, ...params },
  })
  return data
}

export async function getSuggestions(query: string): Promise<string[]> {
  const { data } = await api.get<string[]>('/notes/suggestions', {
    params: { query },
  })
  return data
}

export async function getNote(id: number): Promise<Note> {
  const { data } = await api.get<Note>(`/notes/${id}`)
  return data
}

export async function createNote(payload: NoteRequest): Promise<Note> {
  const { data } = await api.post<Note>('/notes', payload)
  return data
}

export async function updateNote(id: number, payload: NoteRequest): Promise<Note> {
  const { data } = await api.put<Note>(`/notes/${id}`, payload)
  return data
}

export async function deleteNote(id: number): Promise<void> {
  await api.delete(`/notes/${id}`)
}

export async function togglePin(id: number): Promise<Note> {
  const { data } = await api.patch<Note>(`/notes/${id}/pin`)
  return data
}