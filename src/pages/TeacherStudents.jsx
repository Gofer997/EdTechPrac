import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import Header from "../components/header.jsx";
import Aside from "../components/aside.jsx";
import Footer from "../components/footer.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Table, Button, Alert, Spinner, Modal, Form } from "react-bootstrap";

function TeacherStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAssignments, setStudentAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }
    fetchStudents();
  }, [navigate]);

  const fetchStudents = () => {
    setLoading(true);
    setError("");
    api
      .get("teacher/students/")
      .then((res) => {
        setStudents(res.data.students);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setError("Ошибка загрузки учеников");
        setLoading(false);
      });
  };

  const fetchStudentAssignments = (studentId, studentName) => {
    setLoadingAssignments(true);
    setError("");
    api
      .get(`teacher/students/${studentId}/assignments/`)
      .then((res) => {
        setStudentAssignments(res.data);
        setSelectedStudent({ id: studentId, name: studentName });
        setShowModal(true);
        setLoadingAssignments(false);
      })
      .catch((err) => {
        console.error("Error fetching assignments:", err);
        setError("Ошибка загрузки заданий");
        setLoadingAssignments(false);
      });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      issued: { bg: "bg-secondary", text: "Выдано" },
      submitted: { bg: "bg-info", text: "Отправлено" },
      under_review: { bg: "bg-warning", text: "На проверке" },
      graded: { bg: "bg-success", text: "Оценено" },
      revoked: { bg: "bg-danger", text: "Отозвано" },
    };
    const statusInfo = statusMap[status] || { bg: "bg-secondary", text: status };
    return <span className={`badge ${statusInfo.bg}`}>{statusInfo.text}</span>;
  };

  const handleOpenGradingModal = (assignment) => {
    setGradingAssignment(assignment);
    setGradeInput(assignment.grade || "");
    setFeedbackInput(assignment.feedback || "");
    setShowGradingModal(true);
  };

  const submitGrade = () => {
    if (!gradingAssignment || !selectedStudent) return;
    setSubmittingGrade(true);
    setError("");
    const payload = {
      grade: gradeInput === "" ? null : gradeInput,
      feedback: feedbackInput === "" ? null : feedbackInput,
    };
    api
      .post(`teacher/students/${selectedStudent.id}/assignments/${gradingAssignment.id}/grade/`, payload)
      .then(() => {
        fetchStudentAssignments(selectedStudent.id, selectedStudent.name);
        setShowGradingModal(false);
        setGradingAssignment(null);
        setGradeInput("");
        setFeedbackInput("");
        setSubmittingGrade(false);
      })
      .catch((err) => {
        console.error("Error submitting grade:", err);
        setError("Ошибка при отправке оценки");
        setSubmittingGrade(false);
      });
  };

  const toggleAnswerExpansion = (assignmentId) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [assignmentId]: !prev[assignmentId]
    }))
  }

  const truncateAnswer = (answer, assignmentId) => {
    if (!answer || answer.length <= 50) return answer
    if (expandedAnswers[assignmentId]) return answer
    return answer.substring(0, 50) + '...'
  }

  const truncateDescription = (description, assignmentId) => {
    if (!description || description.length <= 50) return description
    if (expandedDescriptions[assignmentId]) return description
    return description.substring(0, 50) + '...'
  }

  const toggleDescriptionExpansion = (assignmentId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [assignmentId]: !prev[assignmentId]
    }))
  }

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
            <h2>Ученики моих групп</h2>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {students && students.length > 0 ? (
          <Table responsive bordered hover>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Фамилия</th>
                <th>Username</th>
                <th>Группа</th>
                <th>Уровень</th>
                <th>XP</th>
                <th>Кристаллы</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ cursor: "pointer" }}>
                  <td>{student.first_name || "-"}</td>
                  <td>{student.last_name || "-"}</td>
                  <td>{student.username}</td>
                  <td>{student.group || "-"}</td>
                  <td>{student.level}</td>
                  <td>{student.xp}</td>
                  <td>{student.crystals}</td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        fetchStudentAssignments(
                          student.id,
                          `${student.first_name || ""} ${student.last_name || ""}`.trim()
                        )
                      }
                    >
                      Задания
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Alert variant="info">У вас нет учеников в группах</Alert>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>Задания ученика: {selectedStudent?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingAssignments ? (
              <div className="text-center">
                <Spinner animation="border" />
              </div>
            ) : studentAssignments && studentAssignments.assignments && studentAssignments.assignments.length > 0 ? (
              <Table responsive bordered hover>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Описание</th>
                    <th>Статус</th>
                    <th>Ответ</th>
                    <th>Оценка</th>
                    <th>Обратная связь</th>
                    <th>Срок сдачи</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAssignments.assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.title}</td>
                      <td style={{ maxWidth: "200px", wordWrap: "break-word" }}>
                        {truncateDescription(assignment.description, assignment.id)}
                        {assignment.description && assignment.description.length > 50 && (
                          <Button
                            variant="link"
                            className="p-0 ms-1"
                            onClick={() => toggleDescriptionExpansion(assignment.id)}
                          >
                            {expandedDescriptions[assignment.id] ? 'Свернуть' : 'Подробнее'}
                          </Button>
                        )}
                      </td>
                      <td>{getStatusBadge(assignment.status)}</td>
                      <td style={{ maxWidth: "200px", wordWrap: "break-word" }}>
                        {truncateAnswer(assignment.answer, assignment.id)}
                        {assignment.answer && assignment.answer.length > 50 && (
                          <Button
                            variant="link"
                            className="p-0 ms-1"
                            onClick={() => toggleAnswerExpansion(assignment.id)}
                          >
                            {expandedAnswers[assignment.id] ? 'Свернуть' : 'Подробнее'}
                          </Button>
                        )}
                      </td>
                      <td>{assignment.grade || "-"}</td>
                      <td style={{ maxWidth: "200px", wordWrap: "break-word" }}>{assignment.feedback || "-"}</td>
                      <td>{formatDate(assignment.due_date)}</td>
                      <td>
                        {(assignment.status === "submitted" || assignment.status === "under_review") ? (
                          <Button variant="success" size="sm" onClick={() => handleOpenGradingModal(assignment)}>
                            Проверить
                          </Button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Alert variant="info">У ученика нет заданий</Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Закрыть
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showGradingModal} onHide={() => setShowGradingModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Проверка задания: {gradingAssignment?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="gradeInput">
                <Form.Label>Оценка</Form.Label>
                <Form.Control
                  type="text"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Введите оценку"
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="feedbackInput">
                <Form.Label>Обратная связь</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Напишите комментарий для ученика"
                />
              </Form.Group>
              <div className="mb-2">
                <strong>Ответ ученика:</strong>
                <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", marginTop: "8px" }}>
                  {gradingAssignment?.answer || "-"}
                </div>
              </div>
            </Form>
            {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGradingModal(false)} disabled={submittingGrade}>
              Отмена
            </Button>
            <Button variant="primary" onClick={submitGrade} disabled={submittingGrade}>
              {submittingGrade ? <Spinner as="span" animation="border" size="sm" /> : "Отправить оценку"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
}

export default TeacherStudents;
