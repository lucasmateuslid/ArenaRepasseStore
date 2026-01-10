import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUserRef = useRef<string | null>(null);

  const fetchProfileAndRole = useCallback(
    async (sessionUser: any): Promise<AppUser | null> => {
      if (!sessionUser?.id) return null;

      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsAdmin(data.role === 'admin');
          return data;
        }

        // Usuário novo (ainda não aprovado)
        return {
          id: sessionUser.id,
          name:
            sessionUser.user_metadata?.full_name ||
            sessionUser.email.split('@')[0],
          email: sessionUser.email,
          role: 'viewer',
          is_approved: false,
        };
      } catch (err) {
        console.warn('Erro ao buscar perfil:', err);
        setIsAdmin(false);

        return {
          id: sessionUser.id,
          name: sessionUser.email.split('@')[0],
          email: sessionUser.email,
          role: 'viewer',
          is_approved: false,
        };
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const handleSession = async (sessionUser: any) => {
      if (!mounted) return;

      if (currentUserRef.current === sessionUser.id && appUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      currentUserRef.current = sessionUser.id;
      setUser(sessionUser);

      const profile = await fetchProfileAndRole(sessionUser);

      // 🔒 BLOQUEIO DE USUÁRIO NÃO APROVADO
      if (profile && profile.is_approved === false) {
        alert(
          'Seu cadastro foi realizado, mas ainda está aguardando aprovação do administrador.'
        );
        await supabase.auth.signOut();
        setUser(null);
        setAppUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (mounted) {
        setAppUser(profile);
        setLoading(false);
      }
    };

    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await handleSession(session.user);
      } else if (mounted) {
        setLoading(false);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

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
      });

      return () => subscription.unsubscribe();
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfileAndRole, appUser]);

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
