import React from 'react'
import "bootstrap/dist/css/bootstrap.min.css";
import { Offcanvas, Nav, Button } from "react-bootstrap";

const Footer = () => (


  <footer className="bg-light text-center text-lg-start">
    <div className="container p-4">
      <div className="row">
        <div className="col-lg-6 col-md-12 mb-4 mb-md-0">
          <h5 className="text-uppercase">Footer Content</h5>
          <p>
            Потом заполню. Линки шаблонные.
          </p>
        </div>

        <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
          <h5 className="text-uppercase">Links</h5>
          <ul className="list-unstyled mb-0">
            <li>
              <a href="#!" className="text-dark">
                Link 1
              </a>
            </li>
            <li>
              <a href="#!" className="text-dark">
                Link 2
              </a>
            </li>
            <li>
              <a href="#!" className="text-dark">
                Link 3
              </a>
            </li>
            <li>
              <a href="#!" className="text-dark">
                Link 4
              </a>
            </li>
          </ul>
        </div>

        <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
          <h5 className="text-uppercase mb-0">Links</h5>

          <ul className="list-unstyled">
            <li>
              <a href="#!" className="text-dark">
                Link 1
              </a>
            </li>
            <li>
              <a href="#!" className="text-dark">
                Link 2
              </a>
            </li>
            <li>
              <a href="#!" className="text-dark">
                Link 3
              </a>
            </li>
            <li>
              <a href="#!" className="text-dark">
                Link 4
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="text-center p-3" style={{ backgroundColor: "#003366" }}>
      © 2026 Copyright:
      <a className="text-reset fw-bold" href="https://mdbootstrap.com/">
        MDBootstrap.com
      </a>
    </div>
  </footer>
);

export default Footer;