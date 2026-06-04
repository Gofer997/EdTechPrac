import "bootstrap/dist/css/bootstrap.min.css";
import { Offcanvas, Nav, Button } from "react-bootstrap";
import { useState } from "react";

const Aside = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    window.location.href = "/login";
  };

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
            zIndex: 1050
          }}
        >
          ☰
        </Button>
      )}

      <Offcanvas show={show} onHide={handleClose} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Меню</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Button
              variant="link"
              href="/profile"
              style={{
                color: "black",
                textDecoration: "none",
                justifyContent: "flex-start"
              }}
            >
              <span>Profile</span>
            </Button>
            {localStorage.getItem("access") && (
              <Button
                variant="link"
                onClick={handleLogout}
                style={{
                  color: "black",
                  textDecoration: "none",
                  justifyContent: "flex-start"
                }}
              >
                <span>Выйти</span>
              </Button>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Aside;
