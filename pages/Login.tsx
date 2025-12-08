
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, signUp, supabase } from '../supabaseClient'; // Import supabase direto para insert manual
import { useAuth } from '../contexts/AuthContext';
import { FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

export const Login = () => {
  const { user, appUser, loading: authLoading } = useAuth(); 
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Novo campo Nome
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
        // O redirecionamento é via useEffect
      } else {
        // --- PROCESSO DE CADASTRO COM APROVAÇÃO ---
        setMsg({ text: "Obtendo dados de segurança...", type: 'info' });
        
        // 1. Captura IP
        let ipAddress = 'Desconhecido';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            ipAddress = ipData.ip;
        } catch (e) {
            console.warn("Falha ao obter IP", e);
        }

        const userAgent = navigator.userAgent;

        // 2. Cria Usuário no Auth
        const { data: authData, error: authError } = await signUp(email, password);
        if (authError) throw authError;

        if (authData.user) {
            // 3. Salva na tabela app_users com status pendente
            const { error: dbError } = await supabase
                .from('app_users')
                .upsert({
                    id: authData.user.id,
                    email: email,
                    name: name || email.split('@')[0],
                    role: 'editor', // Default role
                    is_approved: false, // BLOQUEADO POR PADRÃO
                    ip_address: ipAddress,
                    user_agent: userAgent
                });
            
            if (dbError) {
                console.error("Erro ao salvar detalhes", dbError);
                // Não bloqueamos o fluxo, mas logamos
            }
        }

        setMsg({ 
            text: "Solicitação enviada! Seu acesso está pendente de aprovação pelo administrador.", 
            type: 'success' 
        });
        setIsLogin(true);
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setMsg({ text: err.message || "Erro de autenticação", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-red/20 via-black to-black z-0"></div>
      
      <div className="bg-brand-surface border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">
            ARENA<span className="text-brand-orange">ADMIN</span>
          </h1>
          <p className="text-gray-500 text-sm">Acesso restrito a colaboradores autorizados.</p>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded text-sm font-bold text-center border ${
            msg.type === 'error' ? 'bg-red-900/50 text-red-400 border-red-500/50' : 
            msg.type === 'success' ? 'bg-green-900/50 text-green-400 border-green-500/50' :
            'bg-blue-900/50 text-blue-400 border-blue-500/50'
          }`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Campo Nome (Apenas no Cadastro) */}
          {!isLogin && (
            <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Seu Nome Completo</label>
                <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><FaUserPlus/></div>
                <input 
                    type="text" 
                    required={!isLogin}
                    className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-orange outline-none transition"
                    placeholder="João da Silva"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                </div>
            </div>
          )}

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

          {!isLogin && (
             <div className="text-[10px] text-gray-500 bg-gray-900/50 p-2 rounded border border-gray-800 flex items-start gap-2">
                <FaShieldAlt className="mt-0.5 text-brand-orange"/>
                <p>Seu IP e Identificação do Dispositivo serão registrados para análise de segurança pelo administrador.</p>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-bold py-3 rounded-xl shadow-glow transition transform active:scale-95 flex items-center justify-center gap-2 mt-6 uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? <><FaSignInAlt/> Acessar Painel</> : <><FaUserPlus/> Solicitar Acesso</>)}
          </button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-gray-800 flex flex-col gap-4">
          <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-gray-500 hover:text-white transition underline">
            {isLogin ? "Não tem conta? Solicite acesso" : "Já tem conta? Fazer Login"}
          </button>
          
          <Link to="/" className="text-xs font-bold text-gray-400 hover:text-brand-orange transition flex items-center justify-center gap-2 py-2">
            <FaArrowLeft /> Voltar para o Site
          </Link>
        </div>
      </div>
    </div>
  );
};