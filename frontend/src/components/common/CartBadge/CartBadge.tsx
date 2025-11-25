import { type FC, useEffect } from 'react'
import './CartBadge.css'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../Routes'
import { MINIO_BASE_URL, USE_PROXY_IMAGES } from '../../../config/target'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
  selectCartItemsCount,
  selectCartLoading,
  selectCartAnalysisId,
} from '../../../features/applicationDraft/selectors'
import { getCartInfoAsync } from '../../../features/applicationDraft/applicationDraftSlice'
import { selectIsAuthenticated } from '../../../features/auth/selectors'

export const CartBadge: FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const count = useAppSelector(selectCartItemsCount)
  const loading = useAppSelector(selectCartLoading)
  const analysisId = useAppSelector(selectCartAnalysisId)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  // Загружаем информацию о корзине при монтировании компонента и при изменении статуса авторизации
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCartInfoAsync())
    }
  }, [dispatch, isAuthenticated])

  const normalizedBase = MINIO_BASE_URL
  const fallbackIcon = `${import.meta.env.BASE_URL}cart.svg`
  const iconPath =
    !USE_PROXY_IMAGES && normalizedBase
      ? `${normalizedBase}/cart.svg`
      : fallbackIcon

  const handleClick = () => {
    // Переход на страницу заявки, если есть активная корзина
    if (analysisId) {
      navigate(`${ROUTES.APPLICATION}/${analysisId}`)
    } else {
      // Иначе на страницу спектрального анализа
      navigate(ROUTES.SPECTRUM)
    }
  }

  return (
    <button className="cart-badge" onClick={handleClick} type="button">
      <img
        src={iconPath}
        alt="Корзина"
        onError={(e) => {
          (e.target as HTMLImageElement).onerror = null
          ;(e.target as HTMLImageElement).src = fallbackIcon
        }}
      />
      <span className="cart-text">
        {loading ? 'Загрузка...' : `В заявке: ${count}`}
      </span>
    </button>
  )
}
