import type { Pigment, PigmentsResult } from '../types/pigment'
import { PIGMENTS_MOCK } from '../data/mockPigments'
import { API_BASE_URL } from '../config/target'

export interface PigmentFiltersRequest {
  search?: string
  color?: string
  dateFrom?: string | null
  dateTo?: string | null
}

const MOCK_STORAGE_KEY = 'spectro_mock_mode'

const shouldUseMock = (): boolean => {
  if (typeof window === 'undefined') return false

  const searchParams = new URLSearchParams(window.location.search)
  const mockParam = searchParams.get('mock')

  if (mockParam === '1') {
    window.localStorage.setItem(MOCK_STORAGE_KEY, '1')
    return true
  }

  if (mockParam === '0') {
    window.localStorage.removeItem(MOCK_STORAGE_KEY)
    return false
  }

  return window.localStorage.getItem(MOCK_STORAGE_KEY) === '1'
}

const parseDateStart = (value?: string | null) => {
  if (!value) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const parseDateEnd = (value?: string | null) => {
  if (!value) return null
  const date = new Date(`${value}T23:59:59Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const filterPigmentsLocally = (filters: PigmentFiltersRequest): PigmentsResult => {
  const { search, color, dateFrom, dateTo } = filters
  let filtered = PIGMENTS_MOCK

  if (search) {
    const lowered = search.toLowerCase()
    filtered = filtered.filter(
      (pigment) =>
        pigment.name.toLowerCase().includes(lowered) ||
        pigment.brief.toLowerCase().includes(lowered),
    )
  }

  if (color) {
    const loweredColor = color.toLowerCase()
    filtered = filtered.filter(
      (pigment) => (pigment.color || '').toLowerCase().includes(loweredColor),
    )
  }

  const fromDate = parseDateStart(dateFrom)
  const toDate = parseDateEnd(dateTo)

  if (fromDate || toDate) {
    filtered = filtered.filter((pigment) => {
      if (!pigment.created_at) return false
      const createdAt = new Date(pigment.created_at)
      if (Number.isNaN(createdAt.getTime())) return false
      if (fromDate && createdAt < fromDate) return false
      if (toDate && createdAt > toDate) return false
      return true
    })
  }

  return { pigments: filtered, count: filtered.length }
}

export const getPigments = async (filters: PigmentFiltersRequest = {}): Promise<PigmentsResult> => {
  const { search = '', color = '', dateFrom, dateTo } = filters
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (color) params.append('color', color)
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)

  const forceMock = shouldUseMock()

  if (forceMock) {
    return Promise.resolve(filterPigmentsLocally(filters))
  }

  return fetch(`${API_BASE_URL}/pigments?${params}`)
    .then((response) => response.json())
    .catch(() => filterPigmentsLocally(filters))
}

export const getPigmentById = async (id: string): Promise<{ pigment: Pigment }> => {
  const forceMock = shouldUseMock()
  if (forceMock) {
    const mockPigment = PIGMENTS_MOCK.find((p) => p.id === parseInt(id))
    if (!mockPigment) throw new Error('Пигмент не найден')
    return Promise.resolve({ pigment: mockPigment })
  }
  return fetch(`${API_BASE_URL}/pigments/${id}`)
    .then((response) => response.json())
    .catch(() => {
      const mockPigment = PIGMENTS_MOCK.find((p) => p.id === parseInt(id))
      if (!mockPigment) {
        throw new Error('Пигмент не найден')
      }
      return { pigment: mockPigment }
    })
}
