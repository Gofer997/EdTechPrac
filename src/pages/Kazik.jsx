import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import Aside from "../components/aside";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import api from "../api";
import styles from "./RoulettePage.module.css"; 

const COLORS = {
  red: { label: "Красное", hex: "#dc2626", multiplier: 2 },
  black: { label: "Чёрное", hex: "#1e293b", multiplier: 2 },
  green: { label: "Зелёное", hex: "#16a34a", multiplier: 5 },
};

const Kazik = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [choice, setChoice] = useState("red");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }
    const userRole = localStorage.getItem("role") || "";
    setRole(userRole);
    if (userRole !== "student") {
      setLoading(false);
      return;
    }
    fetchHistory();
    fetchBalance();
  }, [navigate]);

  const fetchBalance = async () => {
    try {
      const response = await api.get("student/profile/");
      setBalance(response.data.crystals);
    } catch (err) {
      console.log("Balance error:", err, response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/roulette/");
      setHistory(response.data);
    } catch (err) {
      console.error("Ошибка загрузки истории:", err);
    }
  };

  const handleSpin = useCallback(async () => {
    const bet = parseInt(amount, 10);
    if (!bet || bet <= 0) {
      setError("Введите корректную сумму ставки");
      return;
    }
    setError("");
    setSpinning(true);
    setResult(null);

    try {
      const { data } = await api.post("/roulette/", {
        amount: bet,
        choice: choice,
      });
      setResult(data);
      setBalance(data.new_balance);
      fetchHistory();
    } catch (err) {
      const msg = err.response?.data?.error || "Ошибка при выполнении ставки";
      setError(msg);
    } finally {
      setSpinning(false);
    }
  }, [amount, choice]);

  if (loading) {
    return (
      <div>
        <Header />
        <Aside />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
        <Footer />
      </div>
    );
  }

  if (role !== "student") {
    return (
      <div>
        <Header />
        <Aside />
        <Container className="py-5">
          <Alert variant="warning">Рулетка доступна только ученикам.</Alert>
        </Container>
        <Footer />
      </div>
    );
  }

  const resultColorHex = result ? COLORS[result.result]?.hex : null;

  return (
    <div>
      <Header />
      <Aside />
      <Container className="py-5">
        <h2 className="text-center mb-4">Рулетка</h2>

        {balance !== null && (
          <div className="text-center mb-4 fs-5">
            💎 {balance} кристаллов
          </div>
        )}

        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-center gap-3 mb-3">
                  {Object.entries(COLORS).map(([key, val]) => (
                    <Button
                      key={key}
                      variant="outline-secondary"
                      className={`${styles.colorBtn} ${choice === key ? styles.active : ""}`}
                      style={{
                        backgroundColor: choice === key ? val.hex : "transparent",
                        color: choice === key ? "white" : val.hex,
                        borderColor: val.hex,
                      }}
                      onClick={() => setChoice(key)}
                      disabled={spinning}
                    >
                      {val.label} (x{val.multiplier})
                    </Button>
                  ))}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Ставка (кристаллы)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={spinning}
                    placeholder="Введите сумму"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button
                    variant="warning"
                    size="lg"
                    onClick={handleSpin}
                    disabled={spinning}
                  >
                    {spinning ? "Крутится..." : "Крутить"}
                  </Button>
                </div>

                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                {result && (
                  <div className="mt-4 text-center">
                    <div
                      className="py-2 px-4 rounded-pill d-inline-block text-white fw-bold mb-3"
                      style={{ backgroundColor: resultColorHex }}
                    >
                      {COLORS[result.result].label}
                    </div>
                    {result.win ? (
                      <Alert variant="success">
                        🎉 Вы выиграли {result.win_amount} кристаллов!
                      </Alert>
                    ) : (
                      <Alert variant="light">😞 Вы проиграли ставку</Alert>
                    )}
                    <div className="text-muted">
                      Новый баланс: {result.new_balance} 💎
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center mt-5">
          <Col md={8}>
            <Card>
              <Card.Body>
                <Card.Title>Последние ставки</Card.Title>
                {history.length === 0 ? (
                  <p className="text-muted">История пуста</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Ставка</th>
                          <th>Выбор</th>
                          <th>Результат</th>
                          <th>Выигрыш</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((bet) => (
                          <tr key={bet.id}>
                            <td>{new Date(bet.created_at).toLocaleString()}</td>
                            <td>{bet.amount} 💎</td>
                            <td>
                              <span
                                className="badge rounded-pill text-white"
                                style={{ backgroundColor: COLORS[bet.choice]?.hex }}
                              >
                                {COLORS[bet.choice]?.label}
                              </span>
                            </td>
                            <td>
                              <span
                                className="badge rounded-pill text-white"
                                style={{ backgroundColor: COLORS[bet.result_color]?.hex }}
                              >
                                {COLORS[bet.result_color]?.label}
                              </span>
                            </td>
                            <td className={bet.win ? "text-success fw-bold" : "text-muted"}>
                              {bet.win
                                ? `+${bet.amount * (bet.choice === "green" ? 5 : 2)}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default Kazik;
