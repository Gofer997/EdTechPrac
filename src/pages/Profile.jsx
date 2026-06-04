import { useEffect, useState } from 'react'
import Header from '../components/header.jsx'
import Footer from '../components/footer.jsx'
import Aside from '../components/aside.jsx'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, Row, Col, Alert, Spinner, Card } from 'react-bootstrap'
import api from '../api.js'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentResponse = await api.get('me/student/')
        setProfile(studentResponse.data)
        setRole('student')
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 404) {
          try {
            const teacherResponse = await api.get('me/teacher/')
            setProfile(teacherResponse.data)
            setRole('teacher')
          } catch (teacherError) {
            console.error(teacherError)
            setError('Не удалось загрузить профиль')
          }
        } else {
          console.error(error)
          setError(<a href="/login">Попробуйте войти в аккаунт</a>)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (  
    <div>
      <Header />
      <Aside />
      <Container className="py-4">
        <Row className="justify-content-md-center">
          <Col md={8} lg={6}>
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" />
              </div>
            )}

            {!loading && error && <Alert variant="danger">{error}</Alert>}

            {!loading && profile && (
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title className="mb-3">
                    Профиль {role === 'teacher' ? 'преподавателя' : 'студента'}
                  </Card.Title>

                  <p><strong>Логин:</strong> {profile.username}</p>
                  <p><strong>Имя:</strong> {profile.first_name || 'Не указано'}</p>
                  <p><strong>Фамилия:</strong> {profile.last_name || 'Не указано'}</p>
                  <p><strong>Email:</strong> {profile.email || 'Не указан'}</p>

                  {role === 'student' && (
                    <>
                      <p><strong>Группа:</strong> {profile.group || 'Не указана'}</p>
                      <p><strong>XP:</strong> {profile.xp}</p>
                      <p><strong>Уровень:</strong> {profile.level}</p>
                    </>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  )
}

export default Profile