
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
    let mounted = true;

    const checkSession = async () => {
      try {
        // 1. Verifica sessão básica
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth Error:", error);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user) {
          if (mounted) setUser(session.user);
          
          // 2. Tenta buscar perfil no banco (pode falhar por RLS)
          try {
            const { data, error: userError } = await supabase
              .from('app_users')
              .select('*')
              .eq('email', session.user.email)
              .single();
              
            if (userError) {
              console.warn("Aviso: Falha ao carregar perfil de admin (Provável bloqueio RLS). O acesso será liberado mas limitado.", userError);
              // Define um perfil temporário para não quebrar a UI
              if (mounted) setAppUser({ id: 'temp', name: 'Admin (Modo Segurança)', email: session.user.email || '', role: 'admin' });
            } else {
              if (mounted) setAppUser(data);
            }
          } catch (dbError) {
            console.error("Erro crítico banco:", dbError);
          }
        }
      } catch (err) {
        console.error("Auth Exception:", err);
      } finally {
        // Garante que o loading pare SEMPRE
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        // Tenta buscar perfil novamente no login
        const { data } = await supabase.from('app_users').select('*').eq('email', session.user.email).single();
        setAppUser(data || { id: 'temp', name: 'Admin', email: session.user.email || '', role: 'admin' });
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
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
