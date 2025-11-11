import { type FC, useEffect, useState } from 'react'
import './CartBadge.css'
import { getCartInfo } from '../../../services/spectrumApi'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../Routes'

export const CartBadge: FC = () => {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadCart = async () => {
      setLoading(true)
      const info = await getCartInfo()
      setCount(info.items_count ?? 0)
      setLoading(false)
    }

    loadCart()
  }, [])

  const minioBase = (import.meta as any).env?.VITE_MINIO_BASE_URL as string | undefined
  const normalizedBase = minioBase ? minioBase.replace(/\/$/, '') : ''
  const iconPath = normalizedBase ? `${normalizedBase}/cart.svg` : '/cart.svg'

  const handleClick = () => {
    navigate(ROUTES.SPECTRUM)
  }

  return (
    <button className="cart-badge" onClick={handleClick} type="button">
      <img
        src={iconPath}
        alt="Корзина"
        onError={(e) => {
          (e.target as HTMLImageElement).onerror = null
          ;(e.target as HTMLImageElement).src = '/cart.svg'
        }}
      />
      <span className="cart-text">
        {loading ? 'Загрузка...' : `В заявке: ${count}`}
      </span>
    </button>
  )
}
