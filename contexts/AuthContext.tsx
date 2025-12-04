
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { AppUser } from '../types';

interface AuthContextType {
  user: any | null;
  appUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  
  // Ref para rastrear o usuário atual sem depender do ciclo de renderização
  // Isso evita race conditions dentro do listener do Supabase
  const currentUserRef = useRef<string | null>(null);

  /**
   * -------------------------------------------------------------------
   * fetchProfileAndRole()
   * - Faz a leitura segura da tabela app_users
   * - Se o Supabase permitir ler → Admin
   * - Se bloquear via RLS → Viewer
   * -------------------------------------------------------------------
   */
  const fetchProfileAndRole = useCallback(async (sessionUser: any): Promise<AppUser | null> => {
    if (!sessionUser?.id) return null;

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      // 📌 Caso admin:
      // Se conseguiu ler → RLS liberou → Role válida
      if (data && data.role === 'admin') {
        setIsAdmin(true);
        return data;
      }

      // 📌 Caso viewer:
      // Se RLS bloqueou OU registro não existe ⇒ Viewer
      setIsAdmin(false);

      return {
        id: sessionUser.id,
        name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
        email: sessionUser.email,
        role: 'viewer',
      };
    } catch (err) {
      console.warn('Erro ao buscar perfil (provável RLS):', err);

      setIsAdmin(false);

      // fallback seguro
      return {
        id: sessionUser.id,
        name: sessionUser.email.split('@')[0],
        email: sessionUser.email,
        role: 'viewer',
      };
    }
  }, []);

  /**
   * --------------------------------------------------------------
   *  Inicialização e Listener
   * --------------------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    // Função única para processar o login e carregar dados
    const handleSession = async (sessionUser: any) => {
      if (!mounted) return;
      
      // CRÍTICO: Prevenção de Loop de Loading
      // Se já temos este usuário carregado e o perfil existe, não fazemos nada.
      // Isso corrige o erro de tela de loading ao navegar 'Voltar' ou trocar de abas.
      if (currentUserRef.current === sessionUser.id && appUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        currentUserRef.current = sessionUser.id;
        setUser(sessionUser);

        const profile = await fetchProfileAndRole(sessionUser);
        
        if (mounted) {
          setAppUser(profile);
        }
      } catch (error) {
        console.error("Erro ao processar sessão:", error);
        // Em caso de erro, definimos um usuário básico para não travar o app
        if (mounted && !appUser) {
           setAppUser({
             id: sessionUser.id,
             name: 'Usuário',
             email: sessionUser.email,
             role: 'viewer'
           });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const initAuth = async () => {
      // 1. Check Inicial
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleSession(session.user);
      } else {
        if (mounted) setLoading(false);
      }

      // 2. Listener de Eventos
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          // console.log(`Auth Event: ${event}`);

          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session?.user) {
              await handleSession(session.user);
            }
          } else if (event === 'SIGNED_OUT') {
            currentUserRef.current = null;
            setUser(null);
            setAppUser(null);
            setIsAdmin(false);
            setLoading(false);
          }
          // Ignoramos TOKEN_REFRESHED explicitamente para evitar re-renderizações
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfileAndRole]); // Removido 'appUser' das dependências para evitar loops

  /**
   * --------------------------------------------------------------
   * Logout
   * --------------------------------------------------------------
   */
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    currentUserRef.current = null;
    setUser(null);
    setAppUser(null);
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        isAdmin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
