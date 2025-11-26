
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AppUser } from '../types';

interface AuthContextType {
  user: any | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          // Verificar se existe na tabela app_users
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', session.user.email)
            .single();
            
          if (data && !error) {
            setAppUser(data);
          } else {
            // Se não estiver na tabela de permissão, desloga (segurança extra)
            console.warn("Usuário autenticado mas sem permissão em app_users");
            setAppUser(null);
          }
        } else {
          setUser(null);
          setAppUser(null);
        }
      } catch (error) {
        console.error("Erro auth check:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from('app_users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        setAppUser(data || null);
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
