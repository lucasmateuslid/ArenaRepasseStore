import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componente para rastrear mudanças de rota no Meta Pixel
function PixelTracker() {
  const location = useLocation();

  useEffect(() => {
    // Garante que o fbq existe antes de disparar o evento
    if (typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'PageView');
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <HashRouter>
          <PixelTracker />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;