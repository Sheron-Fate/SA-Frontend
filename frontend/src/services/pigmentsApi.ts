import type { Pigment, PigmentsResult } from '../types/pigment'
import { PIGMENTS_MOCK } from '../data/mockPigments'

export const getPigments = async (search = '', color = ''): Promise<PigmentsResult> => {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (color) params.append('color', color)
  const forceMock = new URLSearchParams(window.location.search).get('mock') === '1'

  if (forceMock) {
    let filteredPigments = PIGMENTS_MOCK
    if (search) {
      filteredPigments = filteredPigments.filter(pigment =>
        pigment.name.toLowerCase().includes(search.toLowerCase()) ||
        pigment.brief.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (color) {
      filteredPigments = filteredPigments.filter(pigment => pigment.color === color)
    }
    return Promise.resolve({ pigments: filteredPigments, count: filteredPigments.length })
  }

  return fetch(`/api/pigments?${params}`)
    .then((response) => response.json())
    .catch(() => {
      // Fallback на mock данные с фильтрацией
      let filteredPigments = PIGMENTS_MOCK

      if (search) {
        filteredPigments = filteredPigments.filter(pigment =>
          pigment.name.toLowerCase().includes(search.toLowerCase()) ||
          pigment.brief.toLowerCase().includes(search.toLowerCase())
        )
      }

      if (color) {
        filteredPigments = filteredPigments.filter(pigment => pigment.color === color)
      }

      return { pigments: filteredPigments, count: filteredPigments.length }
    })
}

export const getPigmentById = async (id: string): Promise<{pigment: Pigment}> => {
  const forceMock = new URLSearchParams(window.location.search).get('mock') === '1'
  if (forceMock) {
    const mockPigment = PIGMENTS_MOCK.find(p => p.id === parseInt(id))
    if (!mockPigment) throw new Error('Пигмент не найден')
    return Promise.resolve({ pigment: mockPigment })
  }
  return fetch(`/api/pigments/${id}`)
    .then((response) => response.json())
    .catch(() => {
      // Fallback на mock данные
      const mockPigment = PIGMENTS_MOCK.find(p => p.id === parseInt(id))
      if (!mockPigment) {
        throw new Error('Пигмент не найден')
      }
      return { pigment: mockPigment }
    })
}
