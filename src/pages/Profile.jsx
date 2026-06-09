import { useEffect, useState, useRef } from 'react'
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
  Image,
  Button,
  Badge,
} from 'react-bootstrap'
import api from '../api.js'


function Profile() {
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const avatarInputRef = useRef(null)

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append('avatar', file)
    
      api.patch('student/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => {
        setProfile((prev) => ({ ...prev, avatar_url: response.data.avatar_url }))
      })
      .catch((error) => {
        console.error(error)
        setError('Ошибка загрузки аватарки')
      })
    }
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentResponse = await api.get('student/profile/')
        setProfile(studentResponse.data)
        setRole('student')
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 404) {
          try {
            const teacherResponse = await api.get('teacher/profile/')
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
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
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

            {!loading && profile && (
              <Card className="shadow-sm overflow-hidden">
                <Card.Body className="p-4">
                  <Row className="align-items-center">
                    <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
                      <div
                        role="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="d-inline-block position-relative"
                        style={{ cursor: 'pointer' }}
                        aria-label="Изменить аватар"
                      >
                        <Image
                          src={profile.avatar_url || '/default-avatar.png'}
                          roundedCircle
                          width={140}
                          height={140}
                          alt="Аватар пользователя"
                          className="border"
                        />

                        {uploading && (
                          <div
                            className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center"
                            style={{
                              width: 140,
                              height: 140,
                              background: 'rgba(255,255,255,0.6)',
                              borderRadius: '50%',
                            }}
                          >
                            <Spinner animation="border" size="sm" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          Изменить аватар
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          ref={avatarInputRef}
                          onChange={handleAvatarChange}
                          className="d-none"
                        />
                      </div>
                    </Col>

                    <Col xs={12} md={8}>
                      <div className="d-flex align-items-start justify-content-between">
                        <div>
                          <h4 className="mb-1">
                            {profile.first_name || profile.username}{' '}
                            {profile.last_name ? profile.last_name : ''}
                          </h4>
                          <div className="text-muted mb-2">
                            <small>{profile.email || 'Email не указан'}</small>
                          </div>

                          <Badge bg={role === 'teacher' ? 'success' : 'info'} className="me-2">
                            {role === 'teacher' ? 'Преподаватель' : 'Студент'}
                          </Badge>
                        </div>

                        <div className="text-end">
                          <small className="text-muted">XP</small>
                          <div className="fw-bold">{profile.xp ?? '-'}</div>
                        </div>
                      </div>

                      <hr />

                      <Row>
                        <Col xs={12} md={6}>
                          <p className="mb-1">
                            <strong>Логин:</strong> {profile.username}
                          </p>
                          <p className="mb-1">
                            <strong>Группа:</strong> {profile.group || 'Не указана'}
                          </p>
                        </Col>

                        <Col xs={12} md={6}>
                          <p className="mb-1">
                            <strong>Уровень:</strong> {profile.level ?? '-'}
                          </p>
                          <p className="mb-1">
                            <strong>Кристаллы:</strong> {profile.crystals ?? '-'}
                          </p>
                        </Col>
                      </Row>

                      {error && (
                        <Alert variant="danger" className="mt-3">
                          {error}
                        </Alert>
                      )}
                    </Col>
                  </Row>
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