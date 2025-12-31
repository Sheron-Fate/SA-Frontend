import { type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Container } from 'react-bootstrap'
import { ROUTES } from '../Routes'
import './ErrorPages.css'

export const NotFoundPage: FC = () => {
  const navigate = useNavigate()

  return (
    <Container className="error-page">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Страница не найдена</h2>
        <p className="error-description">
          К сожалению, запрашиваемая страница не существует или была перемещена.
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
