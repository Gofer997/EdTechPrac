import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/header.jsx'
import Footer from '../components/footer.jsx'
import Aside from '../components/aside.jsx'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import {
  Container,
  Row,
  Col,
  Alert,
  Spinner,
  Card,
  Badge,
  Button,
  Form,
  Modal,
} from 'react-bootstrap'
import api from '../api.js'

function Homeworks() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [filteredAssignments, setFilteredAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [userRole, setUserRole] = useState('')
  
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [answer, setAnswer] = useState('')
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedAnswers, setExpandedAnswers] = useState({})
  const [expandedDescriptions, setExpandedDescriptions] = useState({})

  useEffect(() => {
    if (!localStorage.getItem('access')) {
      navigate('/login')
      return
    }

    const fetchUserData = async () => {
      try {
        const profileResponse = await api.get('student/profile/')
        setUserRole('student')
      } catch (studentErr) {
        try {
          await api.get('teacher/profile/')
          setUserRole('teacher')
        } catch (teacherErr) {
          setUserRole('')
        }
      }
    }

    fetchUserData()
  }, [navigate])

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!userRole) return
      
      setLoading(true)
      try {
        const endpoint = userRole === 'teacher' ? 'assignments/teacher/feed/' : 'assignments/feed/'
        const response = await api.get(endpoint)
        setAssignments(response.data)
        setFilteredAssignments(response.data)
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить задания')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [userRole])

  useEffect(() => {
    if (filter === 'all') {
      setFilteredAssignments(assignments)
    } else if (filter === 'pending') {
      setFilteredAssignments(assignments.filter(a => 
        a.effective_status === 'issued' || a.effective_status === 'overdue'
      ))
    } else if (filter === 'completed') {
      setFilteredAssignments(assignments.filter(a => 
        a.effective_status === 'submitted' || 
        a.effective_status === 'under_review' || 
        a.effective_status === 'graded'
      ))
    }
  }, [filter, assignments])

  const getStatusBadge = (status) => {
    const statusMap = {
      issued: { bg: 'primary', text: 'Выдано' },
      submitted: { bg: 'info', text: 'Отправлено' },
      under_review: { bg: 'warning', text: 'На проверке' },
      graded: { bg: 'success', text: 'Оценено' },
      revoked: { bg: 'danger', text: 'Отозвано' },
      overdue: { bg: 'danger', text: 'Просрочено' },
    }
    const config = statusMap[status] || { bg: 'secondary', text: status }
    return <Badge bg={config.bg}>{config.text}</Badge>
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Не указан'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('Ответ не может быть пустым')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await api.patch(`assignments/${selectedAssignment.id}/`, {
        status: 'submitted',
        answer: answer
      })
      
      const updatedAssignments = assignments.map(a => 
        a.id === selectedAssignment.id 
          ? { ...a, status: 'submitted', answer: answer, effective_status: 'submitted' }
          : a
      )
      setAssignments(updatedAssignments)
      setShowSubmitModal(false)
      setAnswer('')
      setSelectedAssignment(null)
    } catch (err) {
      console.error(err)
      setError('Не удалось отправить ответ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGradeAssignment = async () => {
    setSubmitting(true)
    setError('')

    try {
      await api.patch(`assignments/${selectedAssignment.id}/`, {
        status: 'graded',
        grade: parseInt(grade),
        feedback: feedback
      })
      
      const updatedAssignments = assignments.map(a => 
        a.id === selectedAssignment.id 
          ? { ...a, status: 'graded', grade: parseInt(grade), feedback: feedback, effective_status: 'graded' }
          : a
      )
      setAssignments(updatedAssignments)
      setShowGradeModal(false)
      setGrade('')
      setFeedback('')
      setSelectedAssignment(null)
    } catch (err) {
      console.error(err)
      setError('Не удалось поставить оценку')
    } finally {
      setSubmitting(false)
    }
  }

  const openSubmitModal = (assignment) => {
    setSelectedAssignment(assignment)
    setAnswer(assignment.answer || '')
    setShowSubmitModal(true)
  }

  const openGradeModal = (assignment) => {
    setSelectedAssignment(assignment)
    setGrade(assignment.grade || '')
    setFeedback(assignment.feedback || '')
    setShowGradeModal(true)
  }

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
    )
  }

  return (
    <div>
      <Header />
      <Aside />
      <Container className="main-content">
        <Row className="mb-4">
          <Col>
            <h2>Мои задания</h2>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="mb-4">
          <Col>
            <div className="d-flex gap-2">
              <Button 
                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('all')}
              >
                Все
              </Button>
              <Button 
                variant={filter === 'pending' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('pending')}
              >
                Несделанные
              </Button>
              <Button 
                variant={filter === 'completed' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('completed')}
              >
                Сделанные
              </Button>
            </div>
          </Col>
        </Row>

        {filteredAssignments.length === 0 ? (
          <Alert variant="info">Нет заданий</Alert>
        ) : (
          <Row>
            {filteredAssignments.map((assignment) => (
              <Col key={assignment.id} xs={12} md={6} lg={4} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="mb-0">{assignment.title}</h5>
                      {getStatusBadge(assignment.effective_status || assignment.status)}
                    </div>
                    
                    {assignment.description && (
                      <div className="mb-3 flex-grow-1">
                        <p className="text-muted mb-1">{truncateDescription(assignment.description, assignment.id)}</p>
                        {assignment.description && assignment.description.length > 50 && (
                          <Button
                            variant="link"
                            className="p-0"
                            onClick={() => toggleDescriptionExpansion(assignment.id)}
                          >
                            {expandedDescriptions[assignment.id] ? 'Свернуть' : 'Подробнее'}
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      <small className="text-muted d-block">
                        📅 Срок: {formatDate(assignment.due_date)}
                      </small>
                      {assignment.group && (
                        <small className="text-muted d-block">
                          👥 Группа: {assignment.group}
                        </small>
                      )}
                    </div>

                    {(assignment.effective_status === 'graded' || assignment.status === 'graded') && (
                      <div className="mb-3 p-2 bg-light rounded">
                        <div><strong>Оценка:</strong> {assignment.grade || '-'}</div>
                        {assignment.feedback && (
                          <div><strong>Обратная связь:</strong> {assignment.feedback}</div>
                        )}
                      </div>
                    )}

                    {userRole === 'student' && (assignment.effective_status === 'issued' || assignment.effective_status === 'overdue') && (
                      <Button 
                        variant="primary" 
                        className="mt-auto"
                        onClick={() => openSubmitModal(assignment)}
                      >
                        Отправить решение
                      </Button>
                    )}

                    {userRole === 'teacher' && (assignment.status === 'submitted' || assignment.effective_status === 'submitted' || assignment.effective_status === 'under_review') && (
                      <Button 
                        variant="success" 
                        className="mt-auto"
                        onClick={() => openGradeModal(assignment)}
                      >
                        Оценить
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Отправить решение</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAssignment && (
              <>
                <h5>{selectedAssignment.title}</h5>
                <p className="text-muted">{selectedAssignment.description}</p>
                <Form.Group className="mb-3">
                  <Form.Label>Ваш ответ</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Введите ваш ответ на задание..."
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSubmitAnswer} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Оценить задание</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAssignment && (
              <>
                <h5>{selectedAssignment.title}</h5>
                <p className="text-muted">{selectedAssignment.description}</p>
                {selectedAssignment.answer && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <strong>Ответ студента:</strong>
                    <p>{truncateAnswer(selectedAssignment.answer, selectedAssignment.id)}</p>
                    {selectedAssignment.answer && selectedAssignment.answer.length > 50 && (
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => toggleAnswerExpansion(selectedAssignment.id)}
                      >
                        {expandedAnswers[selectedAssignment.id] ? 'Свернуть' : 'Раскрыть полностью'}
                      </Button>
                    )}
                  </div>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Оценка (1-12)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="12"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Обратная связь</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Введите комментарий к оценке..."
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGradeModal(false)}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleGradeAssignment} disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить оценку'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <Footer />
    </div>
  )
}

export default Homeworks
