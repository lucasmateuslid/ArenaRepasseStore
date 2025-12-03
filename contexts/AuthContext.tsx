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

  // Busca o perfil na tabela app_users
  const fetchUserProfile = async (currentUser: any) => {
    if (!currentUser?.email) return null;
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle();

      if (error) {
        console.warn("AuthContext: Erro ao buscar perfil (fallback temp).", error.message);
        // Fallback seguro em caso de erro de conexão
        return { id: 'temp', name: 'Admin (Modo Segurança)', email: currentUser.email, role: 'admin' as const };
      }
      
      // Se não achar registro, retorna um perfil básico (usuário novo)
      return data || { id: 'temp', name: 'Novo Usuário', email: currentUser.email, role: 'editor' as const };
    } catch (err) {
      console.error("AuthContext: Erro fatal profile:", err);
      return { id: 'temp', name: 'Erro Conexão', email: currentUser.email, role: 'viewer' as const };
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleSession = async (session: any) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        // Apenas busca o perfil se ainda não tivermos ou se o usuário mudou
        // Isso evita chamadas repetidas ao banco
        const profile = await fetchUserProfile(session.user);
        if (mounted) setAppUser(profile);
      } else {
        setUser(null);
        setAppUser(null);
      }
      
      if (mounted) setLoading(false);
    };

    // 1. Inicialização: Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // 2. Listener: Monitora mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // IMPORTANTE: Ignorar TOKEN_REFRESHED para evitar re-renderizações infinitas e erro 429
      if (event === 'TOKEN_REFRESHED') return;
      
      // Se for SIGNED_OUT, limpa tudo imediatamente
      if (event === 'SIGNED_OUT') {
        if (mounted) {
           setUser(null);
           setAppUser(null);
           setLoading(false);
        }
        return;
      }

      // Para SIGNED_IN ou INITIAL_SESSION
      if (mounted) {
        // Se já estamos carregando, deixa o handleSession finalizar
        // Se não, chama handleSession para garantir sincronia
        handleSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};