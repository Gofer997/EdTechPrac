import { useEffect, useState } from 'react'
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
} from 'react-bootstrap'
import api from '../api.js'

function Homeworks() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get('assignments/feed/')
        setAssignments(response.data)
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить задания')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [])

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

  return (
    <div>
      <Header />
      <Aside />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <h2 className="mb-4">Мои задания</h2>

            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" />
              </div>
            )}

            {!loading && error && (
              <Alert variant="danger" className="shadow-sm">
                {error}
              </Alert>
            )}

            {!loading && assignments.length === 0 && (
              <Alert variant="info" className="shadow-sm">
                У вас пока нет заданий
              </Alert>
            )}

            {!loading && assignments.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="shadow-sm">
                    <Card.Body>
                      <Row className="align-items-start">
                        <Col>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="mb-0">{assignment.title}</h5>
                            {getStatusBadge(assignment.effective_status || assignment.status)}
                          </div>
                          
                          {assignment.description && (
                            <p className="text-muted mb-3">{assignment.description}</p>
                          )}

                          <div className="d-flex gap-3 mb-3">
                            <small className="text-muted">
                              📅 Срок: {assignment.due_date 
                                ? new Date(assignment.due_date).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Не указан'}
                            </small>
                            {assignment.group && (
                              <small className="text-muted">
                                👥 Группа: {assignment.group}
                              </small>
                            )}
                          </div>

                          {assignment.effective_status === 'issued' && (
                            <Button variant="primary" size="sm">
                              Отправить решение
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  )
}

export default Homeworks
