
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
        // Timeout de segurança: Se o Supabase demorar mais de 3s, destrava a tela
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
        const sessionPromise = supabase.auth.getSession();

        // Corrida entre a sessão e o timeout
        const result: any = await Promise.race([sessionPromise, timeoutPromise]);

        if (!result || !result.data) {
           // Caiu no timeout ou erro
           console.warn("Auth check timed out or failed");
           if (mounted) setLoading(false);
           return;
        }

        const { data: { session } } = result;
        
        if (session?.user) {
          if (mounted) setUser(session.user);
          
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', session.user.email)
            .single();
            
          if (data && !error) {
            if (mounted) setAppUser(data);
          } else {
            console.warn("Usuário autenticado mas sem permissão em app_users");
            if (mounted) setAppUser(null);
          }
        } else {
          if (mounted) {
            setUser(null);
            setAppUser(null);
          }
        }
      } catch (error) {
        console.error("Erro auth check:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        // Tenta buscar permissões novamente ao logar
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
