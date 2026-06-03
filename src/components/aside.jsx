import "bootstrap/dist/css/bootstrap.min.css";
import { Offcanvas, Nav, Button } from "react-bootstrap";
import { useState } from "react";

const Aside = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
            <Nav.Link href="/Profile">Profile</Nav.Link>
            <Nav.Link href="/Logout">Logout</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Aside;
