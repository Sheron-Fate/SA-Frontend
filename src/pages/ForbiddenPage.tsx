import { type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Container } from 'react-bootstrap'
import { ROUTES } from '../Routes'
import './ErrorPages.css'

export const ForbiddenPage: FC = () => {
  const navigate = useNavigate()

  return (
    <Container className="error-page">
      <div className="error-content">
        <h1 className="error-code">403</h1>
        <h2 className="error-title">Доступ запрещен</h2>
        <p className="error-description">
          У вас нет прав доступа к этой странице. Для доступа требуется роль модератора.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate(ROUTES.HOME)}
          className="error-button"
        >
          Вернуться на главную
        </Button>
      </div>
    </Container>
  )
}
