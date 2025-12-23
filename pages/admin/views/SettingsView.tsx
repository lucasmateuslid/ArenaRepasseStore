
import React, { useState, useEffect } from 'react';
import { 
  FaBuilding, FaSave, FaWhatsapp, FaEnvelope, FaClock, 
  FaMapMarkerAlt, FaGlobe, FaEye, FaInstagram, FaFacebook, FaYoutube 
} from 'react-icons/fa';
import { SectionHeader } from '../components/AdminUI';
import { useCompany } from '../../../contexts/CompanyContext';
import BankIcon from '../../../components/BankIcon';

export const SettingsView = ({ showNotification }: { showNotification: (msg: string, type: 'success' | 'error') => void }) => {
  const { settings, updateSettings, loading } = useCompany();
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'desktop' | 'mobile'>('desktop');

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

  const formatWhatsApp = (num: string) => {
    if (!num) return '(00) 00000-0000';
    const clean = num.replace(/\D/g, '');
    if (clean.length === 13) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    return num;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sincronizando Dados...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-24 md:pb-8">
      <SectionHeader 
        title="Gestão da Marca" 
        subtitle="Controle a presença digital e informações oficiais da Arena Repasse" 
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA DE FORMULÁRIOS (8/12) */}
        <form onSubmit={handleSave} className="xl:col-span-7 space-y-6">
          
          {/* IDENTIDADE */}
          <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full pointer-events-none"></div>
            <h3 className="font-black text-white flex items-center gap-3 mb-6 text-lg italic tracking-tight">
              <FaBuilding className="text-brand-orange"/> IDENTIDADE CORPORATIVA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
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
          <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="font-black text-white flex items-center gap-3 mb-6 text-lg italic tracking-tight">
              <FaGlobe className="text-blue-500"/> PRESENÇA SOCIAL
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Instagram</label>
                <input type="text" name="social_instagram" value={formData.social_instagram || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="@arenarepasse" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Facebook URL</label>
                <input type="text" name="social_facebook" value={formData.social_facebook || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">YouTube URL</label>
                <input type="text" name="social_youtube" value={formData.social_youtube || ''} onChange={handleChange} className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none" />
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

        {/* COLUNA DE PREVIEW (5/12) */}
        <div className="xl:col-span-5 sticky top-24 hidden xl:block">
          <div className="bg-brand-dark border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[700px]">
            <div className="p-4 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <FaEye /> Live Preview (Rodapé)
              </h4>
              <div className="flex bg-black/30 p-1 rounded-lg">
                <button 
                  onClick={() => setActivePreviewTab('desktop')}
                  className={`px-3 py-1 rounded text-[10px] font-bold ${activePreviewTab === 'desktop' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
                >
                  Desktop
                </button>
                <button 
                  onClick={() => setActivePreviewTab('mobile')}
                  className={`px-3 py-1 rounded text-[10px] font-bold ${activePreviewTab === 'mobile' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* MOCKUP DO FOOTER */}
            <div className="flex-1 overflow-y-auto bg-brand-darkRed p-8 font-sans">
              <div className="max-w-md mx-auto space-y-8">
                {/* Logo Section */}
                <div>
                   <div className="text-2xl font-black italic tracking-tighter text-white mb-4">
                    {formData.company_name?.split(' ')[0] || 'ARENA'}<span className="text-brand-orange">{formData.company_name?.replace(formData.company_name?.split(' ')[0], '') || 'REPASSE'}</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    O maior estoque de repasse do Brasil. Conectando oportunidades com transparência e segurança.
                  </p>
                </div>

                {/* Info Section */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                      <FaWhatsapp />
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-white/30 uppercase tracking-widest">WhatsApp Vendas</span>
                      <span className="text-white font-bold text-sm">{formatWhatsApp(formData.phone_whatsapp)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 text-white/50 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <FaEnvelope />
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-white/30 uppercase tracking-widest">Email Comercial</span>
                      <span className="text-white/80 text-xs">{formData.email || 'contato@loja.com'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 text-white/50 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <FaClock />
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-white/30 uppercase tracking-widest">Horário</span>
                      <span className="text-white/60 text-[10px] whitespace-pre-line">{formData.opening_hours || 'Horário não definido'}</span>
                    </div>
                  </div>
                </div>

                {/* Banks Mockup */}
                <div className="pt-6 border-t border-white/5">
                   <h5 className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-3">Financiamento Parceiro</h5>
                   <div className="grid grid-cols-2 gap-2">
                      {[33, 341].map(compe => (
                        <div key={compe} className="bg-white/5 border border-white/5 rounded p-2 flex items-center gap-2">
                           <BankIcon bankId={compe} size={20} />
                           <span className="text-[8px] font-bold text-white/40 uppercase">Parceiro</span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Socials */}
                <div className="flex gap-4 pt-4 text-white/40">
                   {formData.social_instagram && <FaInstagram className="text-lg"/>}
                   {formData.social_facebook && <FaFacebook className="text-lg"/>}
                   {formData.social_youtube && <FaYoutube className="text-lg"/>}
                </div>

                <div className="pt-8 text-[9px] text-white/20 border-t border-white/5">
                   &copy; {new Date().getFullYear()} {formData.company_name}. CNPJ: {formData.cnpj}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-brand-orange/10 text-brand-orange text-[9px] font-bold text-center border-t border-brand-orange/20 italic">
               AS ALTERAÇÕES SÃO APLICADAS INSTANTANEAMENTE PARA TODOS OS VISITANTES APÓS SALVAR.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
