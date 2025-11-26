
import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componente Wrapper para o Router
// Usamos MemoryRouter para evitar erros de Location.assign em ambientes de preview restritos (Blob/Sandbox)
// Isso mantém a navegação funcionando internamente sem tentar manipular a URL do navegador.
function App() {
  return (
    <AuthProvider>
      <MemoryRouter>
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
      </MemoryRouter>
    </AuthProvider>
  );
}

export default App;
