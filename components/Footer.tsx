
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaMotorcycle, FaTruck, FaHome, FaWhatsapp, FaEnvelope, FaClock, FaInstagram } from 'react-icons/fa';
import BankIcon from './BankIcon';
import { useCompany } from '../contexts/CompanyContext';

interface FooterProps {
  handleWhatsApp: () => void;
  onQuickFilter: (type: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ handleWhatsApp, onQuickFilter }) => {
  const { settings } = useCompany();

  const banks = [
    { name: 'SANTANDER', compe: 33 },
    { name: 'BV FINANCEIRA', compe: 655 },
    { name: 'ITAÚ', compe: 341 },
    { name: 'BRADESCO', compe: 237 },
    { name: 'BANCO PAN', compe: 623 },
    { name: 'SAFRA', compe: 422 }
  ];

  const handleNavigation = (type: string) => {
    onQuickFilter(type);
    document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatWhatsApp = (num: string) => {
    if (!num) return '';
    const clean = num.replace(/\D/g, '');
    if (clean.length === 13) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    if (clean.length === 11) return `+55 (${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    return num;
  };

  const renderLogo = () => {
    const name = settings?.company_name || 'Arena Auto Natal';
    const words = name.split(' ');
    const firstWord = words[0];
    const rest = words.slice(1).join(' ');

    return (
      <div className="text-2xl font-black italic tracking-tighter text-white mb-6">
        {firstWord}<span className="text-brand-orange">{rest ? ` ${rest}` : ''}</span>
      </div>
    );
  };

  return (
    <footer className="bg-[#050000] border-t border-gray-900 text-gray-300 pt-16 pb-8 font-sans relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Coluna 1: Branding e Dados */}
          <div className="space-y-6">
            {renderLogo()}
            <p className="text-sm leading-relaxed text-gray-400 font-medium">
              O maior estoque de repasse do Brasil. Conectando oportunidades a investidores e particulares com transparência e segurança.
            </p>
            <div className="pt-6 border-t border-gray-800/50 space-y-2">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Dados da Empresa</p>
               <p className="text-xs text-gray-400 font-bold">{settings?.company_name || 'Arena Auto Natal'}</p>
               <p className="text-xs text-gray-400">CNPJ: {settings?.cnpj || '55.915.981/0001-99'}</p>
               <p className="text-xs text-gray-400 leading-tight">{settings?.address || 'Av. Prudente de Morais, 4892 - Lagoa Nova, Natal - RN, 59063-200'}</p>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="font-black text-white mb-8 uppercase tracking-tight text-sm flex items-center gap-3">
              <span className="w-1 h-5 bg-white rounded-full"></span> ESTOQUE & NAVEGAÇÃO
            </h4>
            <div className="flex gap-2 mb-6">
               <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="w-12 h-12 rounded-xl bg-[#141414] border border-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all active:scale-95 group">
                 <FaHome className="text-lg transition-colors" />
               </button>
               <button onClick={() => handleNavigation('carros')} className="w-12 h-12 rounded-xl bg-[#141414] border border-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all active:scale-95 group">
                 <FaCar className="text-lg transition-colors" />
               </button>
               <button onClick={() => handleNavigation('motos')} className="w-12 h-12 rounded-xl bg-[#141414] border border-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all active:scale-95 group">
                 <FaMotorcycle className="text-lg transition-colors" />
               </button>
               <button onClick={() => handleNavigation('caminhoes')} className="w-12 h-12 rounded-xl bg-[#141414] border border-gray-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all active:scale-95 group">
                 <FaTruck className="text-lg transition-colors" />
               </button>
            </div>
            <button onClick={handleWhatsApp} className="flex items-center gap-2 text-sm font-bold text-white hover:text-brand-orange transition">
               <FaWhatsapp className="text-green-500 text-lg" /> Falar com Consultor
            </button>
          </div>

          {/* Coluna 3: Financiamento */}
          <div>
            <h4 className="font-black text-white mb-8 uppercase tracking-tight text-sm flex items-center gap-3">
              <span className="w-1 h-5 bg-white rounded-full"></span> FINANCIAMENTO
            </h4>
            <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
              Trabalhamos com as principais financeiras do mercado para garantir a melhor taxa.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {banks.map((bank, idx) => (
                <div key={idx} className="bg-[#110c0c] border border-gray-800/50 rounded-lg p-2.5 flex items-center gap-3 hover:border-gray-600 transition group">
                  <div className="flex-shrink-0">
                    <BankIcon bankId={bank.compe} size={28} borderRadius={4} />
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase truncate">{bank.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 4: Atendimento */}
          <div>
            <h4 className="font-black text-white mb-8 uppercase tracking-tight text-sm flex items-center gap-3">
              <span className="w-1 h-5 bg-white rounded-full"></span> ATENDIMENTO
            </h4>
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[#141414] border border-gray-800 flex items-center justify-center text-green-500 flex-shrink-0">
                    <FaWhatsapp className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5">WHATSAPP VENDAS</p>
                    <button onClick={handleWhatsApp} className="text-white font-black text-sm hover:text-brand-orange transition truncate block">
                      {formatWhatsApp(settings?.phone_whatsapp || '84996697575')}
                    </button>
                  </div>
               </div>

               <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[#141414] border border-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <FaEnvelope className="text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5">EMAIL</p>
                    <p className="text-gray-300 font-bold text-xs truncate">{settings?.email || 'contato@arenarepasse.com.br'}</p>
                  </div>
               </div>

               <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[#141414] border border-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <FaClock className="text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5">HORÁRIO</p>
                    <p className="text-gray-400 font-bold text-[10px] leading-snug whitespace-pre-line">
                      {settings?.opening_hours || 'Seg a Sex: 09h às 18h\nSáb: 09h às 13h'}
                    </p>
                  </div>
               </div>
            </div>
          </div>

        </div>

        {/* Rodapé Inferior */}
        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <p className="text-[10px] font-bold text-gray-600 uppercase">
               &copy; {new Date().getFullYear()} {settings?.company_name || 'Arena Auto Natal'} . Todos os direitos reservados.
             </p>
             <Link to="/admin" className="text-[10px] font-black text-gray-700 hover:text-white transition flex items-center gap-1 uppercase">
               <i className="fa-solid fa-lock text-[8px]"></i> Restrito
             </Link>
          </div>

          <div className="flex items-center gap-6">
             {settings?.social_instagram && (
               <a href={settings.social_instagram.startsWith('http') ? settings.social_instagram : `https://instagram.com/${settings.social_instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-white transition-colors">
                 <FaInstagram size={20} />
               </a>
             )}
          </div>
        </div>
      </div>
    </footer>
  );
};
