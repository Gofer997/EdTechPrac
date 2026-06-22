import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import Header from "../components/header.jsx";
import Aside from "../components/aside.jsx";
import Footer from "../components/footer.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Form, Button, Card, Alert } from "react-bootstrap";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
    role: "",
    teacher_code: "",
    group_code: "",
  });
  const [error, setError] = useState("");


  useEffect(() => {
    if (localStorage.getItem("access")) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("register/", form);
      const loginRes = await api.post("login/", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("access", loginRes.data.access);
      localStorage.setItem("refresh", loginRes.data.refresh);
      if (loginRes.data.role) {
        localStorage.setItem("role", loginRes.data.role);
      }

      navigate("/");
    } catch (err) {
      console.log("Ошибка:", err.response?.data);

      if (err.response?.data) {
        setError(JSON.stringify(err.response.data, null, 2));
      } else {
        setError("Ошибка соединения с сервером");
      }
    }
  };

  return (
    <div className="auth-page auth-register-page">
      <Header />
      <Aside />
      <Container className="auth-shell auth-shell-wide">
        <Row className="align-items-center justify-content-center g-4"> 

          <Col md={11} lg={6} className="order-lg-1">
            <Card className="auth-card auth-card-register">
              <Card.Body>
                <div className="auth-card-header">
                  <span className="auth-kicker">New account</span>
                  <h2>Register</h2>
                  <p>Заполните данные и выберите роль.</p>
                </div>

                {error && <Alert variant="danger" style={{ whiteSpace: "pre-wrap" }}>{error}</Alert>}

                <Form onSubmit={handleSubmit} className="auth-form">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Username</Form.Label>
                        <Form.Control size="lg" type="text" name="username" value={form.username} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control size="lg" type="email" name="email" value={form.email} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>First name</Form.Label>
                        <Form.Control size="lg" type="text" name="first_name" value={form.first_name} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Last name</Form.Label>
                        <Form.Control size="lg" type="text" name="last_name" value={form.last_name} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Password</Form.Label>
                        <Form.Control size="lg" type="password" name="password" value={form.password} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Repeat password</Form.Label>
                        <Form.Control size="lg" type="password" name="password2" value={form.password2} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mt-4">
                    <Form.Label>Role</Form.Label>
                    <div className="auth-role-group">
                      <Form.Check type="radio" id="role-teacher" label="Учитель" name="role" value="teacher" onChange={handleChange} required />
                      <Form.Check type="radio" id="role-student" label="Ученик" name="role" value="student" onChange={handleChange} required />
                    </div>
                  </Form.Group>

                  {form.role === "teacher" && (
                    <Form.Group className="mt-3">
                      <Form.Label>Teacher code</Form.Label>
                      <Form.Control size="lg" type="text" name="teacher_code" value={form.teacher_code} onChange={handleChange} required placeholder="Введите код от админа" />
                    </Form.Group>
                  )}

                  {form.role === "student" && (
                    <Form.Group className="mt-3">
                      <Form.Label>Group code</Form.Label>
                      <Form.Control size="lg" type="text" name="group_code" value={form.group_code} onChange={handleChange} required placeholder="Введите код группы" />
                    </Form.Group>
                  )}

                  <Button className="auth-button mt-4" type="submit">Register</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
}

export default Register;
