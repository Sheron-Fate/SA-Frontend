import { type FC } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './Footer.css';

export const Footer: FC = () => {
  return (
    <footer className="footer">
      <Container>
        <Row>
          <Col md={6}>
            <h5>Спектроскопический анализ</h5>
            <p>Система анализа фрагментов живописи с использованием современных технологий спектроскопии.</p>
          </Col>
          <Col md={6}>
            <h5>Идея ColourLex</h5>
            <p>
              Идея ColourLex основана на взаимосвязи науки и искусства. Чтобы оценить произведение искусства во всей его полноте, необходимо понимать технику художника и знать материалы, использованные при его создании.
            </p>
          </Col>
        </Row>
        <Row>
          <Col>
            <div className="footer-bottom">
              <p>&copy; 2024 Спектроскопический анализ. Все права защищены.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};
