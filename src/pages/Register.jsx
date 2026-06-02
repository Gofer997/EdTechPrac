import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    password2: "",
  });

  useEffect(() => {
    if (localStorage.getItem("access")) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("register/", form);
      const loginRes = await api.post("token/", {
        username: form.username,
        password: form.password,
      });

      localStorage.setItem("access", loginRes.data.access);
      localStorage.setItem("refresh", loginRes.data.refresh);

      navigate("/");
    } catch (err) {
      console.log("Ошибка:", err.response?.data);

      if (err.response?.data) {
        alert(JSON.stringify(err.response.data, null, 2));
      } else {
        alert("Ошибка соединения с сервером");
      }
    }
  };

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <input
            type="password"
            name="password2"
            placeholder="Repeat password"
            value={form.password2}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
