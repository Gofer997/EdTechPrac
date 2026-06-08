import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Container, Row, Col, Form, Button, Card, Alert } from "react-bootstrap";
import Header from "../components/header.jsx";
import Footer from "../components/footer.jsx";
import Aside from "../components/aside.jsx";

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAndRedirect = async () => {
      const access = localStorage.getItem("access");
      const refresh = localStorage.getItem("refresh");

      if (!access) return;

      const payload = parseJwt(access);
      const isExpired = !payload || (payload.exp && Date.now() >= payload.exp * 1000);

      if (!isExpired) {
        navigate("/");
        return;
      }

      if (!refresh) {
        localStorage.removeItem("access");
        return;
      }

      try {
        const res = await api.post("refresh/", { refresh });
        if (res?.data?.access) {
          localStorage.setItem("access", res.data.access);
          if (res.data.refresh) localStorage.setItem("refresh", res.data.refresh);
          navigate("/");
          return;
        } else {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
      } catch (err) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      }
    };

    checkAndRedirect();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("login/", form);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/");
    } catch (err) {
      console.log(err.response?.data || err);
      setError("Неверный email или пароль");
    }
  }

  return (
    <div className="auth-page auth-login-page">
      <Header />
      <Aside />
      <Container className="auth-shell">
        <Row className="align-items-center justify-content-center g-4">
          <Col md={10} lg={5}>
            <Card className="auth-card">
              <Card.Body>
                <div className="auth-card-header">
                  <span className="auth-kicker">Welcome back</span>
                  <h2>Login</h2>
                  <p>Введите данные учётной записи, чтобы продолжить.</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit} className="auth-form">
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      size="lg"
                      name="email"
                      placeholder="Введите email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      size="lg"
                      type="password"
                      name="password"
                      placeholder="Введите пароль"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Button className="auth-button" type="submit">Login</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  )
}

export default Login;
