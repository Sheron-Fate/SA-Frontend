import { type FC } from 'react';
import { Container, Nav, Navbar, Image, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES, ROUTE_LABELS } from '../../../Routes';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsAuthenticated, selectUsername } from '../../../features/auth/selectors';
import { logoutUserAsync } from '../../../features/auth/authSlice';
import { getPigmentsList } from '../../../features/filters/filtersSlice';
import './Navbar.css';

export const AppNavbar: FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const username = useAppSelector(selectUsername)

  // Обработчик события нажатия на кнопку "Выйти"
  const handleExit = async () => {
    await dispatch(logoutUserAsync())

    // Переход на страницу пигментов (фильтры сбросятся автоматически через extraReducers)
    navigate(ROUTES.PIGMENTS)

    // Обновляем список пигментов для показа очищенного поля поиска
    await dispatch(getPigmentsList())
  }

  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container fluid>
        <Navbar.Brand as={Link} to={ROUTES.HOME} className="navbar-brand d-flex align-items-center">
          <Image
            src={`${import.meta.env.BASE_URL}logo.png`}
            onError={(e: any) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = `${import.meta.env.BASE_URL}logo-placeholder.svg`
            }}
            alt="Логотип"
            className="brand-logo"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to={ROUTES.HOME} className="nav-link">
              {ROUTE_LABELS.HOME}
            </Nav.Link>
            <Nav.Link as={Link} to={ROUTES.PIGMENTS} className="nav-link">
              {ROUTE_LABELS.PIGMENTS}
            </Nav.Link>
            <Nav.Link as={Link} to={ROUTES.SPECTRUM} className="nav-link">
              {ROUTE_LABELS.SPECTRUM}
            </Nav.Link>

            {/* Кнопка Войти / Выйти */}
            {!isAuthenticated && (
              <Nav.Link as={Link} to={ROUTES.LOGIN}>
                <Button variant="outline-light" className="login-btn">Войти</Button>
              </Nav.Link>
            )}

            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to={ROUTES.PROFILE} className="nav-link username-link">
                  {username}
                </Nav.Link>
                <Nav.Link>
                  <Button variant="outline-light" className="login-btn" onClick={handleExit}>
                    Выйти
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
