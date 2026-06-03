import React from 'react'
import Header from '../components/header.jsx'
import Footer from '../components/footer.jsx'
import Aside from '../components/aside.jsx'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, Row, Col } from 'react-bootstrap'
import ProtectedRoute from '../routes/ProtectedRoute.js'

function Profile() {
  return (
    <ProtectedRoute>
    <div>
      <Header />
      <Container>
        <Row>
          <Col>
            <h1>Profile</h1>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
    </ProtectedRoute>
  )
}

export default Profile