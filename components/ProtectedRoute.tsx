
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // CORREÇÃO DE EMERGÊNCIA:
  // Verificamos apenas se existe o 'user' (Sessão de Auth básica).
  // Removemos a verificação de 'appUser' (Perfil do banco) pois se o RLS bloquear o banco,
  // essa variável fica nula e causa loop infinito de redirecionamento para o login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
