import { type FC } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../Routes";
import { Button, Col, Container, Row } from "react-bootstrap";

export const HomePage: FC = () => {
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} className="text-center">
          <div className="hero-section">
            <h1 className="hero-title">Спектроскопический анализ фрагмента живописи</h1>
            <p className="hero-description">
              Добро пожаловать в систему спектроскопического анализа!
              Здесь вы можете изучить пигменты и провести анализ фрагментов живописи
              с использованием современных технологий спектроскопии.
            </p>
            <div className="hero-buttons">
              <Link to={ROUTES.PIGMENTS}>
                <Button variant="primary" size="lg" className="me-3">
                  Просмотреть пигменты
                </Button>
              </Link>
              <Link to={ROUTES.SPECTRUM}>
                <Button variant="secondary" size="lg">
                  Спектральный анализ
                </Button>
              </Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
