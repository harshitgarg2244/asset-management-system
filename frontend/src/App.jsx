import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AssetDirectory from './pages/AssetDirectory';
import Licenses from './pages/Licenses';
import MyAssets from './pages/MyAssets';
import RequestAccess from './pages/RequestAccess';
import AuditLogs from './pages/AuditLogs';
import UserManagement from './pages/UserManagement';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route
        path="/assets"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_MANAGER']}>
            <AssetDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/licenses"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'IT_MANAGER']}>
            <Licenses />
          </ProtectedRoute>
        }
      />
      <Route path="/my-assets" element={<ProtectedRoute><MyAssets /></ProtectedRoute>} />
      <Route path="/request-access" element={<ProtectedRoute><RequestAccess /></ProtectedRoute>} />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'AUDITOR']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'AUDITOR']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
