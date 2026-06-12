import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import Header from "../components/header.jsx";
import Aside from "../components/aside.jsx";
import Footer from "../components/footer.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Table, Button, Alert, Spinner } from "react-bootstrap";

function Schedule() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }
    fetchSchedule();
  }, [navigate]);

  const fetchSchedule = (weekStart = "") => {
    setLoading(true);
    setError("");

    let url = "schedule/";
    if (weekStart) {
      url += `?week_start=${weekStart}`;
    }

    api
      .get(url)
      .then((res) => {
        setSchedule(res.data);
        setCurrentWeekStart(res.data.week_start);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching schedule:", err);
        setError("Ошибка загрузки расписания");
        setLoading(false);
      });
  };

  const changeWeek = (days) => {
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentDate.getDate() + days);
    const newWeekStart = currentDate.toISOString().split("T")[0];
    fetchSchedule(newWeekStart);
  };

  const getWeekDays = () => {
    const days = [];
    const startDate = new Date(currentWeekStart);
    const weekDays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        name: weekDays[i],
        date: date.toISOString().split("T")[0],
        dayOfWeek: i,
      });
    }

    return days;
  };

  const getLessonsForDay = (dayDate) => {
    if (!schedule || !schedule.lessons) return [];
    return schedule.lessons.filter((lesson) => lesson.date === dayDate);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div>
        <Header />
        <Aside />
        <Container className="main-content">
          <div className="text-center mt-5">
            <Spinner animation="border" />
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  const weekDays = getWeekDays();

  return (
    <div>
      <Header />
      <Aside />
      <Container className="main-content">
        <Row className="mb-4">
          <Col>
            <h2>Расписание</h2>
            <p className="text-muted">
              {schedule && `${formatDate(schedule.week_start)} - ${formatDate(schedule.week_end)}`}
            </p>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="mb-3">
          <Col className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => changeWeek(-7)}>
              ← Предыдущая неделя
            </Button>
            <Button variant="outline-primary" onClick={() => changeWeek(7)}>
              Следующая неделя →
            </Button>
            <Button variant="outline-secondary" onClick={() => fetchSchedule()}>
              Сегодня
            </Button>
          </Col>
        </Row>

        <Table responsive bordered hover className="schedule-table">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Время</th>
              {weekDays.map((day) => (
                <th key={day.date} className="text-center">
                  <div>{day.name}</div>
                  <small className="text-muted">{formatDate(day.date)}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
              <tr key={hour}>
                <td className="text-center align-middle">
                  {hour}:00
                </td>
                {weekDays.map((day) => {
                  const dayLessons = getLessonsForDay(day.date);
                  const lesson = dayLessons.find((l) => {
                    const lessonHour = parseInt(l.start_time.split(":")[0]);
                    return lessonHour === hour;
                  });

                  return (
                    <td key={day.date} className="align-middle">
                      {lesson && (
                        <div className="lesson-cell p-2 bg-light rounded">
                          <div className="fw-bold">{lesson.subject}</div>
                          <div className="small text-muted">{lesson.teacher}</div>
                          <div className="small">
                            {lesson.start_time} - {lesson.end_time}
                          </div>
                          {lesson.room && <div className="small text-muted">Каб. {lesson.room}</div>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </div>
  );
}

export default Schedule;
