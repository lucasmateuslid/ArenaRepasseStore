
import React, { useState, useEffect } from 'react';
import { 
  FaBuilding, FaSave, FaWhatsapp, FaEnvelope, FaClock, 
  FaMapMarkerAlt, FaGlobe, FaInstagram, FaFacebook, FaYoutube, FaStore 
} from 'react-icons/fa';
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
        showNotification(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`, 'error');
      } else {
        showNotification('Configurações aplicadas com sucesso!', 'success');
      }
    } catch (err: any) {
      showNotification('Erro inesperado: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sincronizando Dados...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-24 md:pb-8">
      <SectionHeader 
        title="Gestão da Marca" 
        subtitle="Controle a presença digital e informações oficiais da Arena Repasse" 
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* IDENTIDADE */}
        <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full pointer-events-none"></div>
          <h3 className="font-black text-white flex items-center gap-3 mb-6 text-lg italic tracking-tight">
            <FaBuilding className="text-brand-orange"/> IDENTIDADE CORPORATIVA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome Fantasia</label>
              <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none transition-all focus:ring-1 focus:ring-brand-orange/30" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">CNPJ Oficial</label>
              <input type="text" name="cnpj" value={formData.cnpj || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none transition-all" placeholder="00.000.000/0001-00" />
            </div>
          </div>
        </div>

        {/* ATENDIMENTO */}
        <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <h3 className="font-black text-white flex items-center gap-3 mb-6 text-lg italic tracking-tight">
            <FaWhatsapp className="text-green-500"/> CANAIS DE ATENDIMENTO
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">WhatsApp de Vendas (Geral)</label>
              <div className="relative">
                <FaWhatsapp className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500"/>
                <input type="text" name="phone_whatsapp" value={formData.phone_whatsapp || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none" placeholder="5511999999999" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">E-mail Institucional</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none" />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Endereço Físico (Loja/Sede)</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-4 top-4 text-brand-orange"/>
                <textarea name="address" value={formData.address || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none h-20 resize-none" placeholder="Rua, Número - Bairro, Cidade - UF" />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Horário de Funcionamento</label>
              <div className="relative">
                <FaClock className="absolute left-4 top-4 text-gray-500"/>
                <textarea name="opening_hours" value={formData.opening_hours || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none h-20 resize-none" placeholder="Seg a Sex: 09h às 18h..." />
              </div>
            </div>
          </div>
        </div>

        {/* SOCIAL */}
        <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <h3 className="font-black text-white flex items-center gap-3 mb-6 text-lg italic tracking-tight">
            <FaGlobe className="text-blue-500"/> PRESENÇA SOCIAL
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Instagram</label>
              <div className="relative">
                <FaInstagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500"/>
                <input type="text" name="social_instagram" value={formData.social_instagram || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none" placeholder="@arenarepasse" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Facebook URL</label>
              <div className="relative">
                <FaFacebook className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"/>
                <input type="text" name="social_facebook" value={formData.social_facebook || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">YouTube URL</label>
              <div className="relative">
                <FaYoutube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600"/>
                <input type="text" name="social_youtube" value={formData.social_youtube || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Loja OLX URL</label>
              <div className="relative">
                <FaStore className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400"/>
                <input type="text" name="social_olx" value={formData.social_olx || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 pl-12 text-sm text-white focus:border-brand-orange outline-none" placeholder="https://www.olx.com.br/perfil/..." />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="px-10 py-4 bg-brand-orange hover:bg-brand-orangeHover text-white font-black uppercase tracking-widest rounded-2xl shadow-glow transition transform active:scale-95 disabled:opacity-50 flex items-center gap-3 text-sm italic"
          >
            {saving ? 'PROCESSANDO...' : <><FaSave/> PUBLICAR ALTERAÇÕES</>}
          </button>
        </div>
      </form>
    </div>
  );
};
