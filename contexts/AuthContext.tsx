import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
      console.warn('Erro ao buscar perfil:', err);

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
   *  Inicialização da sessão + carregamento do app_user
   * --------------------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const profile = await fetchProfileAndRole(session.user);
          if (mounted) setAppUser(profile);
        } else {
          setUser(null);
          setAppUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Erro ao carregar sessão inicial:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInitialSession();

    /**
     * --------------------------------------------------------------
     *  Listener para mudanças no estado de autenticação
     * --------------------------------------------------------------
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_OUT':
            setUser(null);
            setAppUser(null);
            setIsAdmin(false);
            setLoading(false);
            break;

          case 'SIGNED_IN':
          case 'INITIAL_SESSION':
            if (session?.user) {
              setLoading(true);
              setUser(session.user);
              const profile = await fetchProfileAndRole(session.user);
              if (mounted) {
                setAppUser(profile);
                setLoading(false);
              }
            }
            break;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRole]);

  /**
   * --------------------------------------------------------------
   * Logout
   * --------------------------------------------------------------
   */
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
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
