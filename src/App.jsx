import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Homeworks from "./pages/homeworks";
import Store from "./pages/Store";
import Schedule from "./pages/Schedule";
import TeacherStudents from "./pages/TeacherStudents";
import CurrentLesson from "./pages/CurrentLesson";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/homeworks" element={<Homeworks />} />
      <Route path="/shop" element={<Store />}/>
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/teacher/students" element={<TeacherStudents />} />
      <Route path="/current-lesson" element={<CurrentLesson />} />
    </Routes>
  )
}

export default App;
