import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import ClassroomPage from './pages/ClassroomPage';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/student" element={
                        <ProtectedRoute allowedRole="Student">
                            <StudentDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/instructor" element={
                        <ProtectedRoute allowedRole="Instructor">
                            <InstructorDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/classroom/:sessionId" element={
                        <ProtectedRoute>
                            <ClassroomPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;