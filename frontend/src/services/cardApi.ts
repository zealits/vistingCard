import axios from 'axios'
import type { Card } from '../pages/CardsListPage'
import { getAuthToken } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5070/api',
})

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface PendingChange {
  _id: string
  type: 'edit' | 'delete'
  cardId: Card | string
  payload?: Partial<Card>
  scheduledAt: string
  createdAt?: string
  updatedAt?: string
}

export async function fetchCards(): Promise<Card[]> {
  const res = await api.get<Card[]>('/cards')
  return res.data
}

export async function fetchCardById(id: string): Promise<Card> {
  const res = await api.get<Card>(`/cards/${id}`)
  return res.data
}

export async function createCard(card: Partial<Card>): Promise<Card> {
  const res = await api.post<Card>('/cards', card)
  return res.data
}

export async function updateCard(id: string, card: Partial<Card>): Promise<Card> {
  const res = await api.put<Card>(`/cards/${id}`, card)
  return res.data
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`/cards/${id}`)
}

export async function scheduleDelete(cardId: string): Promise<PendingChange> {
  const res = await api.post<PendingChange>('/pending-changes', { type: 'delete', cardId })
  return res.data
}

export async function scheduleEdit(cardId: string, payload: Partial<Card>): Promise<PendingChange> {
  const res = await api.post<PendingChange>('/pending-changes', { type: 'edit', cardId, payload })
  return res.data
}

export async function fetchPendingChanges(): Promise<PendingChange[]> {
  const res = await api.get<PendingChange[]>('/pending-changes', {
    headers: authHeaders(),
  })
  return res.data
}

export async function applyPendingChange(pendingId: string): Promise<void> {
  await api.post(
    `/pending-changes/${pendingId}/apply`,
    {},
    { headers: authHeaders() },
  )
}

export async function loginAdmin(username: string, password: string): Promise<{ token: string }> {
  const res = await api.post<{ token: string }>('/auth/login', { username, password })
  return res.data
}

export async function uploadCardImage(
  file: File,
): Promise<{ imageUrl: string; publicId: string }> {
  const formData = new FormData()
  formData.append('image', file)
  const res = await api.post<{ imageUrl: string; publicId: string }>(
    '/cards/upload-image',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return res.data
}

export async function runOcrOnImage(
  imageUrl: string,
): Promise<Partial<Card>> {
  const res = await api.post<Partial<Card>>('/cards/ocr', { imageUrl })
  return res.data
}

export async function runOcrOnImages(
  imageUrls: string[],
): Promise<Partial<Card>> {
  if (imageUrls.length === 0) {
    return {}
  }
  const res = await api.post<Partial<Card>>('/cards/ocr', { imageUrls })
  return res.data
}

