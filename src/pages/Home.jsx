import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import Aside from "../components/aside";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import api from "../api.js";
import { Chart } from "chart.js/auto";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [monthlyGrades, setMonthlyGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    const userRole = localStorage.getItem("role") || "";
    setRole(userRole);

    if (userRole === "student") {
      fetchStatistics();
      fetchLeaderboard();
      fetchMonthlyGrades();
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("student/statistics/");
      setStatistics(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Ошибка загрузки статистики");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get("student/leaderboard/");
      setLeaderboard(response.data);
    } catch (err) {
      console.log("Leaderboard error:", err);
    }
  };

  const fetchMonthlyGrades = async () => {
    try {
      const response = await api.get("student/monthly-grades/");
      setMonthlyGrades(response.data);
    } catch (err) {
      console.log("Monthly grades error:", err);
    }
  };

  useEffect(() => {
    if (monthlyGrades) {
      const timer = setTimeout(() => {
        if (chartRef.current) {
          if (chartInstance.current) {
            chartInstance.current.destroy();
          }

          const ctx = chartRef.current.getContext('2d');
          chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
              labels: monthlyGrades.labels,
              datasets: [{
                label: 'Средняя оценка',
                data: monthlyGrades.data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: Math.max(...monthlyGrades.data) + 1,
                  min: 0
                }
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                }
              }
            }
          });
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }
  }, [monthlyGrades]);

  if (loading) {
    return (
      <div>
        <Header />
        <Aside />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Aside />
      <Container className="py-5">
        <Row>
          <Col md={12}>
            <h1>Добро пожаловать в EdTech</h1>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {role === "student" && statistics ? (
          <Row className="mt-4">
            <Col md={8}>
              <Row>
                <Col md={12}>
                  <Card className="mb-3">
                    <Card.Body>
                      <Card.Title className="mb-3">Задания</Card.Title>
                      <Row>
                        <Col md={6}>
                          <div className="text-center">
                            <div className="display-4 fw-bold text-success">
                              {statistics.completed_assignments}
                            </div>
                            <div className="text-muted">Выполнено</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="text-center">
                            <div className="display-4 fw-bold text-warning">
                              {statistics.incomplete_assignments}
                            </div>
                            <div className="text-muted">Невыполнено</div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {monthlyGrades && (
                <Row>
                  <Col md={12}>
                    <Card className="mb-3">
                      <Card.Body>
                        <Card.Title className="mb-3">Средние оценки по месяцам</Card.Title>
                        <div style={{ height: '300px' }}>
                          <canvas ref={chartRef}></canvas>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </Col>

            <Col md={4}>
              {leaderboard && (
                <Card>
                  <Card.Body>
                    <Card.Title className="mb-4">Лидерборд: {leaderboard.group_name}</Card.Title>
                    <div className="table-responsive">
                      <table className="table table-hover table-sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Ученик</th>
                            <th>XP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboard.leaderboard.map((student) => (
                            <tr
                              key={student.student_id}
                              className={student.is_current_user ? "table-primary" : ""}
                            >
                              <td className="fw-bold">{student.rank}</td>
                              <td>
                                {student.first_name} {student.last_name}
                                {student.is_current_user && " (Вы)"}
                              </td>
                              <td className="fw-bold text-primary">{student.xp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        ) : role === "teacher" ? (
          <Row className="mt-4">
            <Col md={12}>
              <Card>
                <Card.Body>
                  <Card.Title>Панель преподавателя</Card.Title>
                  <Card.Text>
                    Добро пожаловать! Используйте меню слева для управления группами, уроками и заданиями.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : null}
      </Container>
      
      <Footer />
    </div>
  );
};

export default Home;