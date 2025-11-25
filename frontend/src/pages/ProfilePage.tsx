import { type FC, useEffect, useState, FormEvent } from 'react'
import { Container, Card, Form, Button, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { BreadCrumbs } from '../components/common/BreadCrumbs/BreadCrumbs'
import { ROUTES, ROUTE_LABELS } from '../Routes'
import { useAppSelector } from '../store/hooks'
import { selectIsAuthenticated, selectUsername } from '../features/auth/selectors'
import { buildApiUrl } from '../utils/api'
import './ProfilePage.css'

const ProfilePage: FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const username = useAppSelector(selectUsername)
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN)
    }
  }, [isAuthenticated, navigate])

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault()
    if (!newPassword.trim()) {
      setErrorMessage('Введите новый пароль')
      setStatus('error')
      return
    }

    try {
      setStatus('loading')
      setErrorMessage(null)
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl('/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Ошибка при смене пароля' }))
        throw new Error(data.message || 'Ошибка при смене пароля')
      }

      setStatus('success')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error: any) {
      setStatus('error')
      setErrorMessage(error?.message || 'Не удалось сменить пароль')
    }
  }

  if (!isAuthenticated) {
    return null
    }

  return (
    <Container className="profile-page">
      <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.PROFILE }]} />

      <Card className="profile-card">
        <Card.Body>
          <Card.Title>Здравствуйте, {username || 'пользователь'}!</Card.Title>
          <div className="profile-info">
            <div className="info-row">
              <span>Почта:</span>
              <strong>Будет добавлено позже</strong>
            </div>
            <div className="info-row">
              <span>Инициалы:</span>
              <strong>Будет добавлено позже</strong>
            </div>
            <div className="info-row">
              <span>Страна научного центра:</span>
              <strong>Будет добавлено позже</strong>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="profile-card">
        <Card.Body>
          <Card.Title>Сменить пароль</Card.Title>
          {status === 'success' && <Alert variant="success">Пароль успешно обновлён</Alert>}
          {status === 'error' && errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Form onSubmit={handlePasswordChange}>
            <Form.Group controlId="currentPassword" className="mb-3">
              <Form.Label>Текущий пароль</Form.Label>
              <Form.Control
                type="password"
                placeholder="Введите текущий пароль"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="newPassword" className="mb-4">
              <Form.Label>Новый пароль</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Сохранение...' : 'Сменить пароль'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default ProfilePage
