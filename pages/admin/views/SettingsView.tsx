
import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSave, FaWhatsapp, FaEnvelope, FaClock, FaHashtag, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import { SectionHeader } from '../components/AdminUI';
import { useCompany } from '../../../contexts/CompanyContext';

export const SettingsView = ({ showNotification }: { showNotification: (msg: string, type: 'success' | 'error') => void }) => {
  const { settings, updateSettings, loading } = useCompany();
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await updateSettings(formData);
      
      if (error) {
        // Extrai a mensagem de erro de forma legível
        const errorMsg = error.message || JSON.stringify(error);
        
        if (
            errorMsg.includes('does not exist') || 
            errorMsg.includes('42P01') || 
            errorMsg.includes('Could not find the table') || 
            errorMsg.includes('schema cache')
        ) {
           showNotification('ERRO CRÍTICO: Tabela "company_settings" não existe. Solicite ao suporte para criar a tabela no banco de dados.', 'error');
        } else {
           showNotification(`Erro ao salvar: ${errorMsg}`, 'error');
        }
      } else {
        showNotification('Configurações atualizadas com sucesso!', 'success');
      }
    } catch (err: any) {
      showNotification('Erro inesperado: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 text-center py-10">Carregando dados da empresa...</div>;

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0 max-w-4xl">
      <SectionHeader title="Configurações da Empresa" subtitle="Gerencie os dados visíveis no rodapé e contatos do site" />

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dados Principais */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
           <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
             <FaBuilding className="text-brand-orange"/> Identidade & Localização
           </h3>
           
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome da Empresa</label>
             <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" required />
           </div>
           
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">CNPJ</label>
             <input type="text" name="cnpj" value={formData.cnpj || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="00.000.000/0001-00" />
           </div>

           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Endereço Completo</label>
             <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-500"/>
                <textarea name="address" value={formData.address || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-white focus:border-brand-orange outline-none resize-none h-20" placeholder="Rua, Número - Bairro, Cidade - UF" />
             </div>
           </div>
        </div>

        {/* Contato & Horários */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
           <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
             <FaWhatsapp className="text-green-500"/> Contato & Atendimento
           </h3>
           
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">WhatsApp Principal (Apenas números)</label>
             <div className="relative">
                <FaWhatsapp className="absolute left-3 top-3.5 text-green-500"/>
                <input type="text" name="phone_whatsapp" value={formData.phone_whatsapp || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-white focus:border-brand-orange outline-none" placeholder="5511999999999" required />
             </div>
             <p className="text-[10px] text-gray-500 mt-1">* Usado como fallback quando não há consultor definido.</p>
           </div>

           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Email de Contato</label>
             <div className="relative">
                <FaEnvelope className="absolute left-3 top-3.5 text-gray-500"/>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-white focus:border-brand-orange outline-none" />
             </div>
           </div>

           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Horário de Funcionamento</label>
             <div className="relative">
                <FaClock className="absolute left-3 top-3 text-gray-500"/>
                <textarea name="opening_hours" value={formData.opening_hours || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 pl-10 text-sm text-white focus:border-brand-orange outline-none resize-none h-20" placeholder="Seg a Sex: 09h às 18h..." />
             </div>
           </div>
        </div>

        {/* Redes Sociais */}
        <div className="md:col-span-2 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
           <h3 className="font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
             <FaGlobe className="text-blue-400"/> Redes Sociais
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Instagram (URL ou @)</label>
               <input type="text" name="social_instagram" value={formData.social_instagram || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="@arenarepasse" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Facebook (URL)</label>
               <input type="text" name="social_facebook" value={formData.social_facebook || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">YouTube (URL)</label>
               <input type="text" name="social_youtube" value={formData.social_youtube || ''} onChange={handleChange} className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" />
             </div>
           </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
           <button 
             type="submit" 
             disabled={saving}
             className="px-8 py-3 bg-brand-orange hover:bg-brand-orangeHover text-white font-bold rounded-xl shadow-glow transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
           >
             {saving ? 'Salvando...' : <><FaSave/> Salvar Alterações</>}
           </button>
        </div>

      </form>
    </div>
  );
};
