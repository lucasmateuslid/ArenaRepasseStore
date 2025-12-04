
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showSpinner, setShowSpinner] = useState(true);

  // Timeout de segurança: Se o loading demorar mais de 3s, forçamos a decisão.
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowSpinner(false);
      }, 3000); // 3 segundos max de loading visual
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [loading]);

  // Se estiver carregando E ainda estiver dentro do tempo limite, mostra spinner
  if (loading && showSpinner) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-xs animate-pulse">Verificando credenciais...</p>
      </div>
    );
  }

  // Se parou de carregar (ou timeout) e não tem usuário, redireciona
  if (!user) {
    console.warn("Acesso negado: Usuário não autenticado ou sessão expirada.");
    return <Navigate to="/login" replace />;
  }

  // Se chegou aqui, está autenticado (ou assumimos que sim após o timeout se user existir)
  return <>{children}</>;
};
