
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session Check Error:", error);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user) {
          if (mounted) setUser(session.user);
          
          // Tenta buscar o perfil do usuário na tabela app_users
          // Se falhar (ex: por RLS), não impede o app de rodar, apenas avisa.
          const { data, error: userError } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', session.user.email)
            .single();
            
          if (userError) {
            console.warn("Usuário autenticado, mas erro ao buscar perfil em 'app_users'. Verifique o SQL RLS.", userError);
            // Em dev, podemos assumir um usuário temporário se o banco travar
            // if (mounted) setAppUser({ id: 'temp', name: 'Admin Temp', email: session.user.email || '', role: 'admin' });
            if (mounted) setAppUser(null); 
          } else {
            if (mounted) setAppUser(data);
          }
        }
      } catch (err) {
        console.error("Auth Exception:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from('app_users').select('*').eq('email', session.user.email).single();
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
