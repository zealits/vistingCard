import axios from 'axios'
import type { Card } from '../pages/CardsListPage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

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

