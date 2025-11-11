import { type FC } from 'react';
import { Container, Nav, Navbar, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ROUTES, ROUTE_LABELS } from '../../../Routes';
import './Navbar.css';

export const AppNavbar: FC = () => {
  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container fluid>
        <Navbar.Brand as={Link} to={ROUTES.HOME} className="navbar-brand d-flex align-items-center">
          <Image
            src="/logo.png"
            onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo-placeholder.svg' }}
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
