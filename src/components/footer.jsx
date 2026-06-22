import React from 'react'
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-white text-dark mt-auto border-top">
      <Container className="py-5">
        <Row>
          <Col lg={4} md={6} className="mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3 fw-bold text-primary">EdTech</h5>
            <p className="text-muted">
              Современная образовательная платформа для учеников и преподавателей. 
              Управляйте группами, уроками, заданиями и отслеживайте прогресс в одном месте.
            </p>
          </Col>

          <Col lg={2} md={6} className="mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3">Навигация</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="/" className="text-muted text-decoration-none">
                  Главная
                </a>
              </li>
              <li className="mb-2">
                <a href="/schedule" className="text-muted text-decoration-none">
                  Расписание
                </a>
              </li>
              <li className="mb-2">
                <a href="/lessons" className="text-muted text-decoration-none">
                  Уроки
                </a>
              </li>
              <li className="mb-2">
                <a href="/assignments" className="text-muted text-decoration-none">
                  Задания
                </a>
              </li>
            </ul>
          </Col>

          <Col lg={2} md={6} className="mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3">Ресурсы</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="/shop" className="text-muted text-decoration-none">
                  Магазин
                </a>
              </li>
              <li className="mb-2">
                <a href="/profile" className="text-muted text-decoration-none">
                  Профиль
                </a>
              </li>
              <li className="mb-2">
                <a href="/settings" className="text-muted text-decoration-none">
                  Настройки
                </a>
              </li>
              <li className="mb-2">
                <a href="/help" className="text-muted text-decoration-none">
                  Помощь
                </a>
              </li>
            </ul>
          </Col>

          <Col lg={4} md={6} className="mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3">Контакты</h5>
            <ul className="list-unstyled text-muted">
              <li className="mb-2">
                <i className="bi bi-envelope me-2"></i>
                support@edtech.com
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i>
                +7 (708) 949 58-82
              </li>
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2"></i>
                Алматы, Казахстан
              </li>
            </ul>
            <div className="mt-3">
              <a href="#" className="text-primary me-3 fs-5">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-primary me-3 fs-5">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-primary me-3 fs-5">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="text-primary fs-5">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </Col>
        </Row>

        <hr className="my-4" />

        <Row>
          <Col className="text-center text-muted">
            <p className="mb-0">
              © 2026 EdTech. Все права защищены.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;