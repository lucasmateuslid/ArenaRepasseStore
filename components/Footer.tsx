
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaMotorcycle, FaTruck, FaHome, FaWhatsapp, FaEnvelope, FaClock, FaInstagram, FaStore } from 'react-icons/fa';
import { useCompany } from '../contexts/CompanyContext';

interface FooterProps {
  handleWhatsApp: () => void;
  onQuickFilter: (type: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ handleWhatsApp, onQuickFilter }) => {
  const { settings } = useCompany();

  const banks = [
    { name: 'SANTANDER', logo: 'https://vectorseek.com/wp-content/uploads/2023/10/Banco-Santander-Icon-Logo-Vector.svg-.png' },
    { name: 'BV FINAN.', logo: 'https://www.bv.com.br/documents/20121/44219/bv-logo.png/9b800464-b7f5-e9e9-4f9a-f3a666a71abf?t=1645031185498&download=true' },
    { name: 'ITAÚ', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Ita%C3%BA_Unibanco_logo_2023.svg/2048px-Ita%C3%BA_Unibanco_logo_2023.svg.png' },
    { name: 'BRADESCO', logo: 'https://companieslogo.com/img/orig/BBD-6b19aac5.png?t=1720244490' },
    { name: 'BANCO PAN', logo: 'https://cdn.cookielaw.org/logos/82b81c01-85cd-4ada-9c9d-656b3e5682dd/9be12e3b-5e10-436c-826d-d0dfc661f023/9c073e0c-345d-4dae-a9c4-b55a6c15e17f/banco-pan-logo-8.png' },
    { name: 'SAFRA', logo: 'https://portal.coren-sp.gov.br/wp-content/uploads/2022/01/Logo_Safra.png' }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          
          {/* Coluna 1: Branding */}
          <div className="space-y-6">
            {renderLogo()}
            <p className="text-xs leading-relaxed text-gray-500 font-medium">
              Conectando oportunidades a investidores e particulares com transparência e segurança.
            </p>
            <div className="pt-4 border-t border-gray-900 space-y-1.5">
               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Dados da Empresa</p>
               <p className="text-[11px] text-gray-400 font-bold">{settings?.company_name || 'Arena Auto Natal'}</p>
               <p className="text-[11px] text-gray-500">CNPJ: {settings?.cnpj || '55.915.981/0001-99'}</p>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="font-black text-white mb-6 uppercase tracking-tight text-xs flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-orange rounded-full"></span> NAVEGAÇÃO
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
               {[
                 { id: 'home', icon: FaHome, action: () => window.scrollTo({top: 0, behavior: 'smooth'}) },
                 { id: 'carros', icon: FaCar, action: () => handleNavigation('carros') },
                 { id: 'motos', icon: FaMotorcycle, action: () => handleNavigation('motos') },
                 { id: 'caminhoes', icon: FaTruck, action: () => handleNavigation('caminhoes') }
               ].map(item => (
                 <button key={item.id} onClick={item.action} className="w-10 h-10 rounded-lg bg-[#0c0c0c] border border-gray-900 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all active:scale-95">
                   <item.icon className="text-base" />
                 </button>
               ))}
            </div>
            <button onClick={handleWhatsApp} className="flex items-center gap-2 text-[11px] font-bold text-gray-400 hover:text-brand-orange transition">
               <FaWhatsapp className="text-green-500 text-base" /> Suporte Online
            </button>
          </div>

          {/* Coluna 3: Financiamento - MINIMALISTA E COMPACTO */}
          <div>
            <h4 className="font-black text-white mb-6 uppercase tracking-tight text-xs flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-orange rounded-full"></span> FINANCIAMENTO
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {banks.map((bank, idx) => (
                <div key={idx} className="bg-[#080808] border border-white/5 rounded-lg p-2 flex items-center gap-2.5 hover:border-gray-800 transition cursor-default">
                  <div className="flex-shrink-0 w-[26px] h-[26px] bg-white rounded-sm p-0.5 flex items-center justify-center overflow-hidden">
                    <img src={bank.logo} alt={bank.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 tracking-tight uppercase truncate">{bank.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 4: Atendimento */}
          <div>
            <h4 className="font-black text-white mb-6 uppercase tracking-tight text-xs flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-orange rounded-full"></span> ATENDIMENTO
            </h4>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0c0c0c] border border-gray-900 flex items-center justify-center text-green-500 flex-shrink-0">
                    <FaWhatsapp className="text-base" />
                  </div>
                  <button onClick={handleWhatsApp} className="text-white font-black text-xs hover:text-brand-orange transition truncate">
                    {formatWhatsApp(settings?.phone_whatsapp || '84996697575')}
                  </button>
               </div>

               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0c0c0c] border border-gray-900 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <FaEnvelope className="text-sm" />
                  </div>
                  <p className="text-gray-400 font-bold text-[11px] truncate">{settings?.email || 'contato@arenarepasse.com.br'}</p>
               </div>

               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0c0c0c] border border-gray-900 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <FaClock className="text-sm" />
                  </div>
                  <p className="text-gray-500 font-bold text-[9px] leading-tight">
                    {settings?.opening_hours?.split('\n')[0] || 'Seg a Sex: 09h às 18h'}
                  </p>
               </div>
            </div>
          </div>

        </div>

        {/* Rodapé Inferior */}
        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <p className="text-[10px] font-bold text-gray-600 uppercase">
               &copy; {new Date().getFullYear()} {settings?.company_name || 'Arena Auto Natal'}
             </p>
             <Link to="/admin" className="text-[10px] font-black text-gray-800 hover:text-white transition flex items-center gap-1 uppercase">
               <i className="fa-solid fa-lock text-[8px]"></i> Restrito
             </Link>
          </div>

          <div className="flex items-center gap-6">
             {settings?.social_instagram && (
               <a href={settings.social_instagram.startsWith('http') ? settings.social_instagram : `https://instagram.com/${settings.social_instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-white transition-colors">
                 <FaInstagram size={18} />
               </a>
             )}
             {settings?.social_olx && (
               <a href={settings.social_olx} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-white transition-colors flex items-center gap-2">
                 <FaStore size={18} />
                 <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">OLX</span>
               </a>
             )}
          </div>
        </div>
      </div>
    </footer>
  );
};
