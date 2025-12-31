import React, { useState, ChangeEvent, FormEvent } from 'react'
import { Form, Button, Alert, Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginUserAsync } from '../features/auth/authSlice'
import { getPigmentsList } from '../features/filters/filtersSlice'
import { ROUTES } from '../Routes'
import { BreadCrumbs } from '../components/common/BreadCrumbs/BreadCrumbs'
import { ROUTE_LABELS } from '../Routes'
import { selectAuthError, selectIsAuthenticated } from '../features/auth/selectors'
import './LoginPage.css'

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ login: '', password: '' })
  const error = useAppSelector(selectAuthError)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  // Обработчик события изменения полей ввода (login и password)
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Обработчик события нажатия на кнопку "Войти"
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formData.login && formData.password) {
      const result = await dispatch(loginUserAsync({
        login: formData.login,
        password: formData.password,
      }))

      // Если авторизация успешна, обновляем список пигментов и переходим на страницу пигментов
      if (loginUserAsync.fulfilled.match(result)) {
        // Обновляем список пигментов, чтобы загрузить данные с бэкенда (не мок)
        await dispatch(getPigmentsList())
        navigate(ROUTES.PIGMENTS)
      }
    }
  }

  // Если уже авторизован, перенаправляем
  if (isAuthenticated) {
    navigate(ROUTES.PIGMENTS)
    return null
  }

  return (
    <Container className="login-container">
      <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.HOME, path: ROUTES.HOME }, { label: 'Вход' }]} />

      <Container className="login-form-container">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Рады снова Вас видеть!</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="login" style={{ marginBottom: '15px' }}>
            <Form.Label>Логин</Form.Label>
            <Form.Control
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Введите логин"
              required
            />
          </Form.Group>
          <Form.Group controlId="password" style={{ marginBottom: '20px' }}>
            <Form.Label>Пароль</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль"
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" style={{ width: '100%' }}>
            Войти
          </Button>
        </Form>
      </Container>
    </Container>
  )
}

export default LoginPage
