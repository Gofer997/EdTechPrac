import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import Header from "../components/header.jsx";
import Aside from "../components/aside.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Form, Button } from "react-bootstrap";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    password2: "",
  });

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

    try {
      await api.post("register/", form);
      const loginRes = await api.post("token/", {
        username: form.username,
        password: form.password,
      });

      localStorage.setItem("access", loginRes.data.access);
      localStorage.setItem("refresh", loginRes.data.refresh);

      navigate("/");
    } catch (err) {
      console.log("Ошибка:", err.response?.data);

      if (err.response?.data) {
        alert(JSON.stringify(err.response.data, null, 2));
      } else {
        alert("Ошибка соединения с сервером");
      }
    }
  };

  return (
    <div>
      <Header />
      <Aside />
      <Container>
        <Row>
          <Col>
            <Form onSubmit={handleSubmit}>
              <Form.Group>
                <Form.Label>Username</Form.Label>
                <Form.Control type="text" name="username" value={form.username} onChange={handleChange} required />
              </Form.Group>
              <Form.Group>
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" name="password" value={form.password} onChange={handleChange} required />
              </Form.Group>
              <Form.Group>
                <Form.Label>Repeat password</Form.Label>
                <Form.Control type="password" name="password2" value={form.password2} onChange={handleChange} required />
              </Form.Group>
              <Form.Group>
                <Form.Check type="radio" label="Учитель" name="role" value="teacher" onChange={handleChange} required />
                <Form.Check type="radio" label="Ученик" name="role" value="student" onChange={handleChange} required />
              </Form.Group>
              {form.role === "teacher" && (
                <Form.Group>
                  <Form.Label>Код</Form.Label>
                  <Form.Control type="text" name="code" value={form.code} onChange={handleChange} required />
                </Form.Group>
              )}
              <Button type="submit">Register</Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Register;
