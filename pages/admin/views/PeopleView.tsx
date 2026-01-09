
import React, { useState } from 'react';
import { 
  FaPlus, FaWhatsapp, FaTrash, FaKey, FaUserTag, FaCheck, FaTimes, 
  FaDesktop, FaNetworkWired, FaTrophy, FaChartBar, FaBullseye, FaMoneyBillWave, FaEdit
} from 'react-icons/fa';
import { Seller, AppUser } from '../../../types';
import { SectionHeader } from '../components/AdminUI';
import { updateUser, deleteUser } from '../../../supabaseClient'; 

interface SellersViewProps {
  sellers: (Seller & { stats?: { totalQty: number, totalValue: number } })[];
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onEdit?: (seller: Seller) => void;
  saving: boolean;
  isCreating: boolean;
  setIsCreating: (val: boolean) => void;
  formData: Partial<Seller>;
  setFormData: (data: Partial<Seller>) => void;
  isAdmin: boolean;
}

export const SellersView: React.FC<SellersViewProps> = ({ 
  sellers, onSave, onDelete, onEdit, saving, isCreating, setIsCreating, formData, setFormData, isAdmin 
}) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

  const getPercentage = (current: number, goal: number) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader title="Consultores & Performance" subtitle="Gerencie sua equipe e acompanhe metas de vendas" 
        action={isAdmin && <button onClick={() => { setIsCreating(!isCreating); setFormData({ active: true }); }} className="bg-brand-orange text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow"><FaPlus /> {isCreating ? 'Cancelar' : 'Novo Consultor'}</button>}
      />
      
      {isAdmin && isCreating && (
        <form onSubmit={onSave} className="bg-brand-surface border border-brand-orange/30 rounded-2xl p-6 mb-6 shadow-glow relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl pointer-events-none"></div>
           <h4 className="text-white font-black uppercase italic mb-6 flex items-center gap-3 tracking-tight">
             <FaUserTag className="text-brand-orange"/> {formData.id ? 'Editar Consultor' : 'Novo Consultor'}
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" required className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">WhatsApp</label>
                <input type="text" required className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="5511999999999" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value.replace(/\D/g,'')})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-1 flex items-center gap-1"><FaBullseye/> Meta Quantidade</label>
                <input type="number" className="w-full bg-black/40 border border-brand-orange/20 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="Ex: 10" value={formData.goal_qty || ''} onChange={e => setFormData({...formData, goal_qty: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-1 flex items-center gap-1"><FaMoneyBillWave/> Meta Valor (R$)</label>
                <input type="number" className="w-full bg-black/40 border border-brand-orange/20 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="Ex: 500000" value={formData.goal_value || ''} onChange={e => setFormData({...formData, goal_value: Number(e.target.value)})} />
              </div>
              <div className="md:col-span-2 lg:col-span-4 space-y-1.5 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Email (Login do Sistema)</label>
                <input type="email" required={!formData.id} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" placeholder="nome@arenarepasse.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                {!formData.id && <p className="text-[10px] text-gray-500 mt-2 italic font-bold">* Novo acesso será criado com perfil 'Editor' e senha padrão 123456.</p>}
              </div>
           </div>
           <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-800">
             <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 text-[10px] font-black uppercase text-gray-500 hover:text-white transition">Cancelar</button>
             <button type="submit" disabled={saving} className="px-10 py-3 bg-brand-orange text-white rounded-xl font-black text-xs uppercase hover:bg-red-600 transition shadow-glow">{saving ? 'Salvando...' : 'Salvar Consultor'}</button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((s) => {
          const qtyProgress = getPercentage(s.stats?.totalQty || 0, s.goal_qty || 0);
          const valueProgress = getPercentage(s.stats?.totalValue || 0, s.goal_value || 0);

          return (
            <div key={s.id} className="bg-brand-surface border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-brand-orange/40 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange to-red-600 flex items-center justify-center text-white text-xl font-black italic shadow-lg">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-lg tracking-tight uppercase italic">{s.name}</h4>
                      <p className="text-xs text-gray-500 font-bold">{s.whatsapp}</p>
                    </div>
                 </div>
                 {isAdmin && (
                   <div className="flex gap-2">
                     <button onClick={() => onEdit?.(s)} className="p-2.5 text-blue-400 bg-blue-500/10 hover:bg-blue-600 hover:text-white rounded-xl transition" title="Editar"><FaEdit size={14}/></button>
                     <button onClick={() => onDelete(s.id)} className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-600 hover:text-white rounded-xl transition" title="Excluir"><FaTrash size={14}/></button>
                   </div>
                 )}
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-800/50">
                 {/* Estatística de Veículos */}
                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Veículos Vendidos</p>
                          <p className="text-2xl font-black text-white leading-none">{s.stats?.totalQty || 0} <span className="text-xs text-gray-600 font-bold">unidades</span></p>
                       </div>
                       {s.goal_qty && s.goal_qty > 0 ? (
                         <p className="text-[10px] font-black text-brand-orange uppercase bg-brand-orange/10 px-2 py-1 rounded">Meta: {s.goal_qty}</p>
                       ) : null}
                    </div>
                    {s.goal_qty && s.goal_qty > 0 ? (
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-gray-800">
                        <div 
                          className={`h-full transition-all duration-1000 ${qtyProgress >= 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-brand-orange'}`} 
                          style={{ width: `${qtyProgress}%` }}
                        ></div>
                      </div>
                    ) : null}
                 </div>

                 {/* Estatística de Valor */}
                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Volume de Vendas</p>
                          <p className="text-2xl font-black text-white leading-none">{formatCurrency(s.stats?.totalValue || 0)}</p>
                       </div>
                       {s.goal_value && s.goal_value > 0 ? (
                         <p className="text-[10px] font-black text-brand-orange uppercase bg-brand-orange/10 px-2 py-1 rounded">Meta: {formatCurrency(s.goal_value)}</p>
                       ) : null}
                    </div>
                    {s.goal_value && s.goal_value > 0 ? (
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-gray-800">
                        <div 
                          className={`h-full transition-all duration-1000 ${valueProgress >= 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-brand-orange'}`} 
                          style={{ width: `${valueProgress}%` }}
                        ></div>
                      </div>
                    ) : null}
                 </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800/50 flex justify-between items-center">
                 <button onClick={() => window.open(`https://wa.me/${s.whatsapp}`, '_blank')} className="text-[10px] font-black text-green-500 uppercase flex items-center gap-2 hover:underline">
                    <FaWhatsapp/> Contato Direto
                 </button>
                 {s.goal_qty && s.goal_qty > 0 && (
                    <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${qtyProgress >= 100 ? 'bg-green-500/10 text-green-500' : 'bg-brand-orange/10 text-brand-orange'}`}>
                      {qtyProgress >= 100 ? 'Meta Atingida' : `${qtyProgress}% da Meta`}
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface UsersViewProps {
  users: AppUser[];
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onResetPassword?: (id: string) => void;
  saving: boolean;
  isCreating: boolean;
  setIsCreating: (val: boolean) => void;
  formData: Partial<AppUser>;
  setFormData: (data: Partial<AppUser>) => void;
  onApprove?: (id: string) => void; 
}

export const UsersView: React.FC<UsersViewProps> = ({ 
  users, onSave, onDelete, onResetPassword, saving, isCreating, setIsCreating, formData, setFormData, onApprove 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'approved' | 'pending'>('approved');

  const pendingUsers = users.filter(u => u.is_approved === false);
  const approvedUsers = users.filter(u => u.is_approved !== false); 

  const handleApprove = async (id: string) => {
    if(!window.confirm("Aprovar acesso deste usuário?")) return;
    const { error } = await updateUser(id, { is_approved: true });
    if (!error && onApprove) onApprove(id);
  };

  const handleReject = async (id: string) => {
    if(!window.confirm("Rejeitar e excluir solicitação?")) return;
    await onDelete(id);
  };

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SectionHeader title="Usuários do Sistema" subtitle="Controle de acessos e permissões" />
        <div className="flex bg-black/30 p-1 rounded-xl">
           <button 
             onClick={() => setActiveSubTab('approved')}
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${activeSubTab === 'approved' ? 'bg-brand-orange text-white' : 'text-gray-500 hover:text-white'}`}
           >
             Aprovados ({approvedUsers.length})
           </button>
           <button 
             onClick={() => setActiveSubTab('pending')}
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition relative ${activeSubTab === 'pending' ? 'bg-brand-orange text-white' : 'text-gray-500 hover:text-white'}`}
           >
             Pendentes 
             {pendingUsers.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px]">{pendingUsers.length}</span>}
           </button>
        </div>
      </div>
      
      {activeSubTab === 'approved' && (
         <>
           <div className="flex justify-end mb-4">
             <button onClick={() => { setIsCreating(!isCreating); setFormData({ role: 'editor' }); }} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border border-gray-700">
               <FaPlus /> {isCreating ? 'Cancelar' : 'Convidar Novo'}
             </button>
           </div>

           {isCreating && (
            <form onSubmit={onSave} className="bg-brand-surface border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Nome</label><input type="text" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Email</label><input type="email" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Role</label><select className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.role || 'editor'} onChange={e => setFormData({...formData, role: e.target.value as any})}><option value="editor">Editor (Vendedor)</option><option value="admin">Admin (Total)</option></select></div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">* Senha padrão inicial: <strong>123456</strong>. Usuário criado aqui já nasce aprovado.</p>
              <button type="submit" disabled={saving} className="mt-4 px-6 py-2 bg-brand-orange text-white rounded-lg font-bold text-xs uppercase hover:bg-red-600 transition">{saving ? '...' : 'Salvar'}</button>
            </form>
          )}

           <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden">
             <table className="w-full text-left text-sm"><thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold"><tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-gray-800">
                 {approvedUsers.map((u: AppUser) => (
                    <tr key={u.id} className="hover:bg-white/5">
                       <td className="px-6 py-4 text-white font-bold">{u.name}</td>
                       <td className="px-6 py-4 text-gray-400">{u.email}</td>
                       <td className="px-6 py-4 uppercase text-xs">
                         <span className={`px-2 py-1 rounded border ${u.role === 'admin' ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-blue-500 text-blue-500 bg-blue-500/10'}`}>{u.role}</span>
                       </td>
                       <td className="px-6 py-4 text-right flex justify-end gap-2">
                         {onResetPassword && (
                           <button onClick={() => onResetPassword(u.id)} className="text-yellow-500 hover:text-white transition p-2 bg-yellow-500/10 rounded-lg" title="Resetar Senha para 123456">
                             <FaKey size={12}/>
                           </button>
                         )}
                         <button onClick={() => onDelete(u.id)} className="text-red-500 hover:text-white transition p-2 bg-red-500/10 rounded-lg"><FaTrash size={12}/></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
            </table>
           </div>
         </>
      )}

      {activeSubTab === 'pending' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {pendingUsers.length === 0 ? (
                <p className="col-span-2 text-center text-gray-500 py-10 italic">Nenhuma solicitação pendente no momento.</p>
             ) : (
                pendingUsers.map(u => (
                   <div key={u.id} className="bg-brand-surface border border-yellow-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                      <div className="flex justify-between items-start mb-4 pl-3">
                         <div>
                            <h4 className="font-bold text-white text-lg">{u.name}</h4>
                            <p className="text-sm text-gray-400">{u.email}</p>
                            <span className="text-[10px] text-yellow-500 uppercase font-bold bg-yellow-500/10 px-2 py-0.5 rounded mt-1 inline-block">Aguardando Aprovação</span>
                         </div>
                         <div className="text-[10px] text-gray-500 text-right">
                             {new Date(u.created_at || Date.now()).toLocaleDateString('pt-BR')}
                         </div>
                      </div>
                      
                      <div className="bg-black/30 rounded-lg p-3 mb-4 space-y-2 border border-gray-800 pl-3">
                         <div className="flex items-center gap-2 text-xs text-gray-400">
                            <FaNetworkWired className="text-blue-500"/> IP: <span className="text-white font-mono">{u.ip_address || 'Não registrado'}</span>
                         </div>
                         <div className="flex items-start gap-2 text-xs text-gray-400">
                            <FaDesktop className="text-purple-500 mt-0.5"/> 
                            <span className="truncate w-full block" title={u.user_agent}>Device: {u.user_agent ? (u.user_agent.includes('Mobile') ? 'Mobile' : 'Desktop') + ' / ' + u.user_agent.substring(0, 30) + '...' : 'Não registrado'}</span>
                         </div>
                      </div>

                      <div className="flex gap-3 pl-3">
                         <button 
                           onClick={() => handleApprove(u.id)}
                           className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-xs uppercase flex items-center justify-center gap-2 transition shadow-glow"
                         >
                            <FaCheck/> Aprovar
                         </button>
                         <button 
                           onClick={() => handleReject(u.id)}
                           className="flex-1 bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold py-2 rounded-lg text-xs uppercase flex items-center justify-center gap-2 transition"
                         >
                            <FaTimes/> Rejeitar
                         </button>
                      </div>
                   </div>
                ))
             )}
         </div>
      )}

    </div>
  );
};
