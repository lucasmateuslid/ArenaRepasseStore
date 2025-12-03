import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, signUp } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaArrowLeft } from 'react-icons/fa';

export const Login = () => {
  const { user, appUser, loading: authLoading } = useAuth(); 
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const navigate = useNavigate();

  // Redirecionamento Seguro
  useEffect(() => {
    // Só redireciona se a autenticação terminou (loading false) E temos usuário E temos o perfil carregado
    // Isso evita o "chute" de volta do ProtectedRoute
    if (!authLoading && user && appUser) {
      navigate('/admin', { replace: true });
    }
  }, [user, appUser, authLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Não navegamos aqui manualmente. O useEffect acima fará isso quando o estado atualizar.
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMsg({ text: "Cadastro realizado! Se seu email já estiver liberado pelo admin, você pode logar.", type: 'success' });
        setIsLogin(true);
      }
    } catch (err: any) {
      setMsg({ text: err.message || "Erro de autenticação", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Se o AuthContext ainda está carregando, mostra um loader simples para evitar piscadas
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-red/20 via-black to-black z-0"></div>
      
      <div className="bg-brand-surface border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">
            ARENA<span className="text-brand-orange">ADMIN</span>
          </h1>
          <p className="text-gray-500 text-sm">Acesso restrito a colaboradores autorizados.</p>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded text-sm font-bold text-center ${msg.type === 'error' ? 'bg-red-900/50 text-red-400 border border-red-500/50' : 'bg-green-900/50 text-green-400 border border-green-500/50'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Corporativo</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><FaEnvelope/></div>
              <input 
                type="email" 
                required
                className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-orange outline-none transition"
                placeholder="seu.nome@arenarepasse.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><FaLock/></div>
              <input 
                type="password" 
                required
                className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-orange outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-bold py-3 rounded-xl shadow-glow transition transform active:scale-95 flex items-center justify-center gap-2 mt-6 uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? <><FaSignInAlt/> Acessar Painel</> : <><FaUserPlus/> Criar Conta</>)}
          </button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-gray-800 flex flex-col gap-4">
          <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-gray-500 hover:text-white transition underline">
            {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Fazer Login"}
          </button>
          
          <Link to="/" className="text-xs font-bold text-gray-400 hover:text-brand-orange transition flex items-center justify-center gap-2 py-2">
            <FaArrowLeft /> Voltar para o Site
          </Link>
        </div>
      </div>
    </div>
  );
};