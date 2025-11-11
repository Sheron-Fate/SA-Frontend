export interface CartResponse {
  analysis_id: number | null
  items_count: number
  has_active_cart: boolean
}

const defaultCart: CartResponse = {
  analysis_id: null,
  items_count: 0,
  has_active_cart: false,
}

export const getCartInfo = async (): Promise<CartResponse> => {
  try {
    const response = await fetch('/api/spectrum-analysis/cart', {
      credentials: 'include',
    })

    if (!response.ok) {
      // Неавторизован или другая ошибка — возвращаем значение по умолчанию
      return defaultCart
    }

    const data = await response.json()
    return {
      analysis_id: data.analysis_id ?? null,
      items_count: data.items_count ?? 0,
      has_active_cart: data.has_active_cart ?? false,
    }
  } catch (error) {
    console.error('Ошибка получения корзины:', error)
    return defaultCart
  }
}
