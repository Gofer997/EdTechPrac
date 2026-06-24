import React, { useEffect, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import {
  Container,
  Navbar,
  Nav,
  Image,
  Button,
  Badge,
  Dropdown,
  Row,
  Col,
} from 'react-bootstrap'
import api from '../api.js'
import Notifications from './Notifications.jsx'

function Stat({ icon, value, label }) {
  return (
    <div className="d-flex flex-column align-items-center me-3">
      <div className="stat-icon mb-1">{icon}</div>
      <div className="fw-bold">{value}</div>
      <small className="text-muted">{label}</small>
    </div>
  )
}

export default function Header() {
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchByRole = async (targetRole) => {
      const endpoint = targetRole === 'teacher' ? 'teacher/profile/' : 'student/profile/'
      const response = await api.get(endpoint)
      setProfile(response.data)
      setRole(targetRole)
      localStorage.setItem('role', targetRole)
    }

    const fetchProfile = async () => {
      try {
        const storedRole = localStorage.getItem('role')

        if (storedRole === 'teacher' || storedRole === 'student') {
          try {
            await fetchByRole(storedRole)
            return
          } catch {
            await fetchByRole(storedRole === 'teacher' ? 'student' : 'teacher')
            return
          }
        }

        try {
          await fetchByRole('student')
        } catch {
          await fetchByRole('teacher')
        }
      } catch (err) {
        console.error('No profile', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])


  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    window.location.href = '/login'
  }

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm mb-4">
      <Container fluid="md">
        <Navbar.Brand href="/" className="d-flex align-items-center">
          <div
            style={{
              width: 36,
              height: 36,
              background: '#0d6efd',
              color: '#fff',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              marginRight: 10,
            }}
          >
            E
          </div>
          <span className="fw-bold ms-2">EdTech</span>
          <Badge bg="secondary" className="ms-2" pill>Beta</Badge>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto my-2 my-lg-0">
            <Nav.Link href="/">Главная</Nav.Link>
            <Nav.Link href="/about">О проекте</Nav.Link>
          </Nav>

          <div className="d-flex align-items-center">
            {!loading && profile && (
              <div className="me-3">
                <Notifications />
              </div>
            )}
            {!loading && profile ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  id="profile-dropdown"
                  variant="light"
                  className="d-flex align-items-center border-0 bg-transparent"
                >
                  <Image
                    src={profile.avatar_url || '/default-avatar.png'}
                    roundedCircle
                    width={40}
                    height={40}
                    className="me-2 border"
                    alt="avatar"
                  />
                  <div className="d-none d-md-block text-start">
                    <div className="fw-semibold" style={{ lineHeight: 1 }}>
                      {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.username}
                    </div>
                    <small className="text-muted">{role === 'teacher' ? 'Преподаватель' : 'Студент'}</small>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className="p-3 profile-popup shadow-lg" style={{ minWidth: 320 }}>
                  {profile && (
                    <div className="mb-4 p-3 bg-light rounded">
                      <Row className="align-items-center mb-3">
                        <Col xs="auto">
                          <Image
                            src={profile.avatar_url || "/default-avatar.png"}
                            roundedCircle
                            width={48}
                            height={48}
                            className="border"
                          />
                        </Col>
                        <Col>
                          <div className="fw-bold" style={{ fontSize: "14px" }}>
                            {profile.first_name || profile.username}
                          </div>
                          <Badge bg={role === "teacher" ? "success" : "info"} className="mt-1" style={{ fontSize: "11px" }}>
                            {role === "teacher" ? "Преподаватель" : "Студент"}
                          </Badge>
                        </Col>
                      </Row>
                      <Row className="text-center" style={{ fontSize: "12px" }}>
                        <Col>
                          <div className="fw-bold">{profile.xp ?? 0}</div>
                          <div className="text-muted">XP</div>
                        </Col>
                        <Col>
                          <div className="fw-bold">{profile.level ?? 1}</div>
                          <div className="text-muted">Уровень</div>
                        </Col>
                        {role === "student" && (
                          <Col>
                            <div className="fw-bold">{profile.crystals ?? 0}</div>
                            <div className="text-muted">💎</div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  )}

                  <div className="profile-menu">
                    <a className="d-block profile-menu-item" href="/profile">Профиль</a>
                    <div className="d-flex justify-content-between align-items-center profile-menu-item">
                      <span>Язык "заглушка"</span>
                      <Badge bg="light" text="dark">RU</Badge>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="btn btn-outline-danger w-100 mt-2" onClick={handleLogout}>Выйти</button>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Button href="/login" variant="outline-primary" size="sm" className="me-2">Войти</Button>
                <Button href="/register" variant="primary" size="sm">Регистрация</Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}