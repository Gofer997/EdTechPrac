import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import Header from "../components/header.jsx";
import Aside from "../components/aside.jsx";
import Footer from "../components/footer.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Alert, Spinner, Table, Button, Form, Modal } from "react-bootstrap";

function CurrentLesson() {
  const navigate = useNavigate();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [todayLessons, setTodayLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }
    fetchCurrentLesson();
  }, [navigate]);

  const fetchCurrentLesson = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("lessons/current/");
      setCurrentLesson(response.data.current_lesson);
      setStudents(response.data.students || []);
      setTodayLessons(response.data.today_lessons || []);
    } catch (err) {
      console.error("Error fetching current lesson:", err);
      setError("Ошибка загрузки текущего урока");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, [field]: value } : s
    ));
  };

  const handleSelectLesson = async (lessonId) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`lessons/${lessonId}/attendance/`);
      const lessonResponse = await api.get(`lessons/${lessonId}/`);
      const lessonData = lessonResponse.data;
      
      setCurrentLesson({
        id: lessonId,
        subject: lessonData.subject || "Урок",
        start_time: lessonData.start_time || "",
        end_time: lessonData.end_time || "",
        room: lessonData.room || "",
        group: lessonData.group || { id: 0, name: "" },
        date: lessonData.date || new Date().toISOString().split('T')[0]
      });
      
      const studentsData = response.data.map(att => ({
        id: att.student_id,
        username: att.student_name,
        first_name: att.student_name.split(' ')[0] || "",
        last_name: att.student_name.split(' ')[1] || "",
        xp: 0,
        level: 1,
        crystals: 0,
        is_present: att.is_present,
        grade: att.grade,
        crystals_awarded: att.crystals_awarded || 0,
      }));
      
      setStudents(studentsData);
      setTodayLessons([]);
    } catch (err) {
      console.error("Error fetching lesson attendance:", err);
      setError("Ошибка загрузки урока");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!currentLesson) return;
    
    setSaving(true);
    setError("");
    try {
      const attendanceData = students.map(s => ({
        student_id: s.id,
        is_present: s.is_present,
        grade: s.grade || null,
        crystals_awarded: s.crystals_awarded || 0
      }));

      await api.post(`lessons/${currentLesson.id}/attendance/`, attendanceData);
      setError("");
      alert("Данные успешно сохранены");
    } catch (err) {
      console.error("Error saving attendance:", err);
      setError("Ошибка сохранения данных");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!currentLesson || !assignmentTitle) {
      setError("Название задания обязательно");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let dueDate;
      if (assignmentDueDate) {
        dueDate = new Date(assignmentDueDate).toISOString();
      } else {
        dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      const groupId = typeof currentLesson.group === 'object' ? currentLesson.group.id : currentLesson.group;
      
      await api.post("assignments/", {
        title: assignmentTitle,
        description: assignmentDescription,
        group: groupId,
        due_date: dueDate
      });

      setShowAssignmentModal(false);
      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueDate("");
      setError("");
      alert("Домашнее задание успешно создано");
    } catch (err) {
      console.error("Error creating assignment:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.detail || "Ошибка создания домашнего задания");
    } finally {
      setSaving(false);
    }
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

  return (
    <div>
      <Header />
      <Aside />
      <Container className="main-content">
        <Row className="mb-4">
          <Col>
            <h2>Текущий урок</h2>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {!currentLesson ? (
          todayLessons.length > 0 ? (
            <>
              <Alert variant="info">Нет текущего урока. Выберите урок из списка на сегодня:</Alert>
              <Table responsive bordered hover>
                <thead>
                  <tr>
                    <th>Предмет</th>
                    <th>Время</th>
                    <th>Кабинет</th>
                    <th>Группа</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td>{lesson.subject}</td>
                      <td>{lesson.start_time} - {lesson.end_time}</td>
                      <td>{lesson.room || "Не указан"}</td>
                      <td>{lesson.group.name}</td>
                      <td>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleSelectLesson(lesson.id)}
                        >
                          Выбрать
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <Alert variant="info">Нет уроков на сегодня</Alert>
          )
        ) : (
          <>
            <Row className="mb-4">
              <Col>
                <div className="p-3 bg-light rounded">
                  <h5>{currentLesson.subject}</h5>
                  <p className="mb-1">
                    <strong>Группа:</strong> {typeof currentLesson.group === 'object' ? currentLesson.group.name : currentLesson.group}
                  </p>
                  <p className="mb-1">
                    <strong>Время:</strong> {currentLesson.start_time} - {currentLesson.end_time}
                  </p>
                  <p className="mb-1">
                    <strong>Кабинет:</strong> {currentLesson.room || "Не указан"}
                  </p>
                  <p className="mb-0">
                    <strong>Дата:</strong> {currentLesson.date}
                  </p>
                </div>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col className="d-flex gap-2">
                <Button variant="primary" onClick={handleSaveAttendance} disabled={saving}>
                  {saving ? "Сохранение..." : "Сохранить данные"}
                </Button>
                <Button variant="success" onClick={() => setShowAssignmentModal(true)}>
                  Загрузить домашнее задание
                </Button>
              </Col>
            </Row>

            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Фамилия</th>
                  <th>Username</th>
                  <th>Присутствие</th>
                  <th>Оценка (1-12)</th>
                  <th>Кристаллы (0-3)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.first_name || "-"}</td>
                    <td>{student.last_name || "-"}</td>
                    <td>{student.username}</td>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={student.is_present}
                        onChange={(e) => handleAttendanceChange(student.id, "is_present", e.target.checked)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="1"
                        max="12"
                        value={student.grade || ""}
                        onChange={(e) => handleAttendanceChange(student.id, "grade", e.target.value)}
                        style={{ width: "80px" }}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        max="3"
                        value={student.crystals_awarded || 0}
                        onChange={(e) => handleAttendanceChange(student.id, "crystals_awarded", e.target.value)}
                        style={{ width: "80px" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Создать домашнее задание</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Название задания *</Form.Label>
                    <Form.Control
                      type="text"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      placeholder="Введите название задания"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Описание</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={assignmentDescription}
                      onChange={(e) => setAssignmentDescription(e.target.value)}
                      placeholder="Введите описание задания"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Срок сдачи</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={assignmentDueDate}
                      onChange={(e) => setAssignmentDueDate(e.target.value)}
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>
                  Отмена
                </Button>
                <Button variant="primary" onClick={handleCreateAssignment} disabled={saving}>
                  {saving ? "Создание..." : "Создать"}
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </Container>
      <Footer />
    </div>
  );
}

export default CurrentLesson;
