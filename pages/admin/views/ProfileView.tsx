
import React, { useState } from 'react';
import { FaUser, FaLock, FaSave } from 'react-icons/fa';
import { AppUser } from '../../../types';
import { SectionHeader } from '../components/AdminUI';
import { updateAuthPassword, supabase } from '../../../supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';

interface ProfileViewProps {
  appUser: AppUser | null;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ appUser, showNotification }) => {
  const { user } = useAuth(); // Hook para pegar o usuário real da autenticação
  const [name, setName] = useState(appUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);

    try {
      // Correção de Segurança e Erro UUID:
      // Se o ID for 'temp' (o fallback do AuthContext), usamos o ID real da autenticação.
      let targetId = appUser?.id;
      
      if (!targetId || targetId === 'temp') {
        if (user?.id) {
          targetId = user.id;
        } else {
          throw new Error("Não foi possível identificar o ID do usuário logado.");
        }
      }

      // Prepara os dados. Se for o ID temporário, forçamos a criação do registro.
      const payload: any = {
        id: targetId,
        name: name,
        email: appUser?.email || user?.email,
        // Se o registro não existia (era temp), definimos uma role padrão para não quebrar constraints
        role: appUser?.role || 'admin' 
      };

      // Usamos UPSERT (Insert ou Update) para garantir que funcione mesmo se o registro não existir
      const { error } = await supabase
        .from('app_users')
        .upsert(payload);

      if (error) {
        throw error;
      }

      showNotification('Nome atualizado com sucesso!', 'success');
      // Recarrega para limpar o estado "temp" e pegar os dados reais do banco
      setTimeout(() => window.location.reload(), 1000);

    } catch (error: any) {
      console.error(error);
      showNotification('Erro ao atualizar nome: ' + (error.message || 'Erro desconhecido'), 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('As senhas não coincidem.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    setSavingPass(true);
    const { error } = await updateAuthPassword(newPassword);
    
    if (error) {
      showNotification('Erro ao atualizar senha: ' + error.message, 'error');
    } else {
      showNotification('Senha alterada com sucesso!', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    }
    setSavingPass(false);
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl mx-auto pb-20 md:pb-0">
      <SectionHeader title="Meu Perfil" subtitle="Gerencie suas informações de acesso" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card Dados Pessoais */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FaUser />
            </div>
            <div>
              <h3 className="font-bold text-white">Dados Pessoais</h3>
              <p className="text-xs text-gray-500">Informações visíveis no sistema</p>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Email (Não alterável)</label>
              <input 
                type="text" 
                value={appUser?.email || user?.email || ''} 
                disabled 
                className="w-full bg-black/20 border border-gray-800 rounded-lg p-3 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome de Exibição</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none transition"
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={savingName || (name === appUser?.name && appUser?.id !== 'temp')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingName ? 'Salvando...' : <><FaSave/> Atualizar Dados</>}
              </button>
            </div>
            {appUser?.id === 'temp' && (
              <p className="text-[10px] text-yellow-500 mt-2 text-center">
                * Seu perfil ainda não foi sincronizado com o banco. Salve o nome para corrigir.
              </p>
            )}
          </form>
        </div>

        {/* Card Segurança */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center">
              <FaLock />
            </div>
            <div>
              <h3 className="font-bold text-white">Segurança</h3>
              <p className="text-xs text-gray-500">Alteração de senha de acesso</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none transition"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none transition"
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={savingPass || !newPassword}
                className="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-bold py-3 rounded-xl transition shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingPass ? 'Salvando...' : <><FaLock/> Alterar Senha</>}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
