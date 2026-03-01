import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import ClassroomPage from './pages/ClassroomPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/instructor" element={<InstructorDashboard />} />
                <Route path="/classroom/:sessionId" element={<ClassroomPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;