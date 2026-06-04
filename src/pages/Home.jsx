import Header from "../components/header";
import Footer from "../components/footer";
import Aside from "../components/aside";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  return (
    <div>
      <Header />
      <Aside />
      <Container className="py-5">
        <Row>
          <Col md={8}>
            <h1>Welcome to EdTech</h1>
            <p>
              Фото временый вариант я потом эту страницу переделаю
              
            </p>
          </Col>
          <Col md={4}>
            <img src="https://picsum.photos/300/200" alt="EdTech" />
          </Col>
        </Row>
      </Container>
      
      <Footer />
    </div>
  )
}

export default Home