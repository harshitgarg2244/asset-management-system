import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Frontend half of RBAC - hides pages a user isn't allowed to use. The
// backend's allowRoles() middleware is the REAL security boundary; this
// just makes the UI behave correctly.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
