import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import LoginSection from './components/Login/LoginSection';
import AdminSection from './components/Admin/AdminSection';
import ParentSection from './components/Parent/ParentSection';
import PaymentSuccess from './pages/PaymentSuccess';
import Toast from './components/Modals/Toast';

function App() {
  const { currentUser, userRole, logout, error } = useAuth();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Show error from AuthContext
  useEffect(() => {
    if (error) {
      showToastMessage(error, 'error');
    }
  }, [error]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      showToastMessage('Logout berhasil!');
      navigate('/login');
    } else {
      showToastMessage('Logout gagal: ' + result.error);
    }
  };

  return (
    <div className="text-gray-800 antialiased overflow-x-hidden">
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            !currentUser ? (
              <LoginSection showToast={showToastMessage} />
            ) : (
              <Navigate to={userRole === 'admin' ? '/admin' : '/parent'} replace />
            )
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            currentUser && userRole === 'admin' ? (
              <AdminSection onLogout={handleLogout} showToast={showToastMessage} />
            ) : currentUser && !userRole ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <i className="ph ph-spinner animate-spin text-6xl text-blue-600 mb-4"></i>
                  <p className="text-gray-600">Loading user data...</p>
                  {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Parent Routes */}
        <Route
          path="/parent/*"
          element={
            currentUser && userRole === 'parent' ? (
              <ParentSection onLogout={handleLogout} showToast={showToastMessage} />
            ) : currentUser && !userRole ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <i className="ph ph-spinner animate-spin text-6xl text-blue-600 mb-4"></i>
                  <p className="text-gray-600">Loading user data...</p>
                  {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Payment Success Route - Public (accessible after payment) */}
        <Route
          path="/payment/success"
          element={<PaymentSuccess />}
        />

        {/* Default Route */}
        <Route
          path="/"
          element={
            <Navigate to={currentUser ? (userRole === 'admin' ? '/admin' : '/parent') : '/login'} replace />
          }
        />

        {/* 404 Route */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>

      <Toast message={toastMessage} show={showToast} type={toastType} />
      <Toaster />
    </div>
  );
}

export default App;
