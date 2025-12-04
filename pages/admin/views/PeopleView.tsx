
import React from 'react';
import { FaPlus, FaWhatsapp, FaTrash, FaKey, FaUserTag } from 'react-icons/fa';
import { Seller, AppUser } from '../../../types';
import { SectionHeader } from '../components/AdminUI';

interface SellersViewProps {
  sellers: Seller[];
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  saving: boolean;
  isCreating: boolean;
  setIsCreating: (val: boolean) => void;
  formData: Partial<Seller>;
  setFormData: (data: Partial<Seller>) => void;
  isAdmin: boolean;
}

export const SellersView: React.FC<SellersViewProps> = ({ 
  sellers, onSave, onDelete, saving, isCreating, setIsCreating, formData, setFormData, isAdmin 
}) => {
  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader title="Consultores" subtitle="Gerencie sua equipe de vendas" 
        action={isAdmin && <button onClick={() => { setIsCreating(!isCreating); setFormData({ active: true }); }} className="bg-brand-orange text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow"><FaPlus /> {isCreating ? 'Cancelar' : 'Novo'}</button>}
      />
      
      {isAdmin && isCreating && (
        <form onSubmit={onSave} className="bg-brand-surface border border-gray-800 rounded-2xl p-6 mb-6">
           <h4 className="text-white font-bold mb-4 flex items-center gap-2"><FaUserTag/> Novo Consultor</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Completo</label>
                <input type="text" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">WhatsApp</label>
                <input type="text" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="5511999999999" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value.replace(/\D/g,'')})} />
              </div>
              <div className="md:col-span-2 space-y-1 bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg">
                <label className="text-[10px] font-bold text-blue-400 uppercase">Email (Para Login no Sistema)</label>
                <input type="email" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none" placeholder="nome@arenarepasse.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                <p className="text-[10px] text-gray-500 mt-1">* Será criado um usuário 'Editor' automaticamente com a senha padrão <strong>123456</strong>.</p>
              </div>
           </div>
           <button type="submit" disabled={saving} className="mt-4 px-6 py-2 bg-brand-orange text-white rounded-lg font-bold text-xs uppercase hover:bg-red-600 transition">{saving ? '...' : 'Salvar e Gerar Login'}</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sellers.map((s: Seller) => (
          <div key={s.id} className="bg-brand-surface border border-gray-800 p-4 rounded-xl flex items-center justify-between group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-lg"><FaWhatsapp/></div>
                <div>
                   <h4 className="font-bold text-white text-sm">{s.name}</h4>
                   <p className="text-xs text-gray-500">{s.whatsapp}</p>
                   {s.email && <p className="text-[10px] text-blue-400/70">{s.email}</p>}
                </div>
             </div>
             {isAdmin && (
               <button onClick={() => onDelete(s.id)} className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg transition"><FaTrash size={12}/></button>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface UsersViewProps {
  users: AppUser[];
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onResetPassword?: (id: string) => void; // Nova prop
  saving: boolean;
  isCreating: boolean;
  setIsCreating: (val: boolean) => void;
  formData: Partial<AppUser>;
  setFormData: (data: Partial<AppUser>) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ 
  users, onSave, onDelete, onResetPassword, saving, isCreating, setIsCreating, formData, setFormData 
}) => {
  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader title="Usuários do Sistema" 
        action={<button onClick={() => { setIsCreating(!isCreating); setFormData({ role: 'editor' }); }} className="bg-brand-orange text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow"><FaPlus /> {isCreating ? 'Cancelar' : 'Convidar'}</button>}
      />
      {isCreating && (
        <form onSubmit={onSave} className="bg-brand-surface border border-gray-800 rounded-2xl p-6 mb-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Nome</label><input type="text" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Email</label><input type="email" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Role</label><select className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.role || 'editor'} onChange={e => setFormData({...formData, role: e.target.value as any})}><option value="editor">Editor (Vendedor)</option><option value="admin">Admin (Total)</option></select></div>
           </div>
           <p className="text-[10px] text-gray-500 mt-2">* Senha padrão inicial: <strong>123456</strong></p>
           <button type="submit" disabled={saving} className="mt-4 px-6 py-2 bg-brand-orange text-white rounded-lg font-bold text-xs uppercase hover:bg-red-600 transition">{saving ? '...' : 'Salvar'}</button>
        </form>
      )}
      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm"><thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold"><tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Ação</th></tr></thead>
          <tbody className="divide-y divide-gray-800">
             {users.map((u: AppUser) => (
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
    </div>
  );
};
