export interface User {
  id: number
  name: string
  email: string
}

export interface Note {
  id: number
  title: string
  content: string | null
  color: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface NoteRequest {
  title: string
  content?: string
  color?: string
  pinned?: boolean
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface AuthResponse {
  token: string
  tokenType: string
  userId: number
  name: string
  email: string
}

export interface AuthRequest {
  email: string
  password: string
  name?: string
}