
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componente Wrapper para o Router
// Usamos HashRouter (#/admin) para garantir que o roteamento funcione
// independentemente do caminho do servidor ou subdiretório (crucial para Previews e Cloud Run).
function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          {/* Rota coringa para redirecionar erros 404 para a home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
