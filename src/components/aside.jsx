import "bootstrap/dist/css/bootstrap.min.css";
import { Offcanvas, Nav, Button, Image, Badge, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";
import api from "../api.js";

const Aside = () => {
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("");

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const teacher = await api.get("teacher/profile/");
        setProfile(teacher.data);
        setRole("teacher");
      } catch (err) {
        try {
          const student = await api.get("student/profile/");
          setProfile(student.data);
          setRole("student");
        } catch (e) {
          console.error("No profile", e);
        }
      }
    };

    if (localStorage.getItem("access")) {
      fetchProfile();
    }
  }, []);

  return (
    <>
      {!show && (
        <Button
          variant="light"
          onClick={handleShow}
          style={{
            position: "fixed",
            top: "10px",
            left: "10px",
            zIndex: 1050,
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          ☰
        </Button>
      )}

      <Offcanvas show={show} onHide={handleClose} placement="start" style={{ width: "300px" }}>
        <Offcanvas.Header closeButton style={{ borderBottom: "1px solid #eee" }}>
          <Offcanvas.Title style={{ fontWeight: "600" }}>Меню</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
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

          <Nav className="flex-column">
            <div className="mb-2">
              <small className="text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                Основное
              </small>
            </div>
            
            <Button
              variant="link"
              href="/"
              className="w-100 text-start mb-1"
              style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
            >
              🏠 Главная
            </Button>
            
            <Button
              variant="link"
              href="/courses"
              className="w-100 text-start mb-1"
              style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
            >
              📚 Курсы
            </Button>
            
            <Button
              variant="link"
              href="/profile"
              className="w-100 text-start mb-1"
              style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
            >
              👤 Профиль
            </Button>

            {role === "student" && (
              <>
                <div className="mb-2 mt-3">
                  <small className="text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    Обучение
                  </small>
                </div>

                <Button
                  variant="link"
                  href="/schedule"
                  className="w-100 text-start mb-1"
                  style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
                >
                  Расписание
                </Button>

                <Button
                  variant="link"
                  href="/homeworks"
                  className="w-100 text-start mb-1"
                  style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
                >
                  Мои задания
                </Button>

                <div className="mb-2 mt-3">
                  <small className="text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    Магазин
                  </small>
                </div>

                <Button
                  variant="link"
                  href="/shop"
                  className="w-100 text-start mb-1"
                  style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
                >
                  Магазин
                </Button>

                <Button
                  variant="link"
                  href="/my-purchases"
                  className="w-100 text-start mb-1"
                  style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
                >
                  Мои покупки
                </Button>
              </>
            )}

            {role === "teacher" && (
              <>
                <div className="mb-2 mt-3">
                  <small className="text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    Преподаватель
                  </small>
                </div>

                <Button
                  variant="link"
                  href="/schedule"
                  className="w-100 text-start mb-1"
                  style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
                >
                  Расписание
                </Button>

                <Button
                  variant="link"
                  href="/groups"
                  className="w-100 text-start mb-1"
                  style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
                >
                  Группы
                </Button>

                <Button
                  variant="link"
                  href="/assignments"
                  className="w-100 text-start mb-1"
                  style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
                >
                  Задания
                </Button>
              </>
            )}

            <div className="mb-2 mt-3">
              <small className="text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                Другое
              </small>
            </div>
            
            <Button
              variant="link"
              href="/about"
              className="w-100 text-start mb-1"
              style={{ color: "#333", textDecoration: "none", padding: "8px 12px" }}
            >
              ℹ️ О проекте
            </Button>

            {localStorage.getItem("access") && (
              <>
                <hr className="my-3" />
                <Button
                  variant="link"
                  onClick={handleLogout}
                  className="w-100 text-start"
                  style={{ color: "#dc3545", textDecoration: "none", padding: "8px 12px" }}
                >
                  🚪 Выйти
                </Button>
              </>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Aside;
