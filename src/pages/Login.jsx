import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js"
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import Header from "../components/header.jsx";
import Footer from "../components/footer.jsx";
import Aside from "../components/aside.jsx";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (localStorage.getItem("access")) {
      navigate("/");
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("token/", form);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/");
    } catch (err) {
      console.log(err.response?.data);
      alert("Неверный логин или пароль");
    }
  }

  return (
    <div>
      <Header />
      <Aside />
      <Container>
      <Row>
        <Col>
          <h2>Login</h2>

          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Username</Form.Label>
              <Form.Control
                name="username"
                placeholder="Username"
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
              />
            </Form.Group>

            <Button type="submit">Login</Button>
          </Form>
        </Col>
      </Row>
    </Container>
    <Footer />
    </div>
  )
}

export default Login;
