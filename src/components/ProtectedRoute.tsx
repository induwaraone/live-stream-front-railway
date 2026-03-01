import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRole?: 'Student' | 'Instructor';
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user?.userType !== allowedRole) {
        // Redirect to the correct dashboard if wrong role
        return <Navigate to={user?.userType === 'Student' ? '/student' : '/instructor'} replace />;
    }

    return <>{children}</>;
}
