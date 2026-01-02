
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
    { name: 'BV FINAN.', compe: 655 },
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
                  <div className="flex-shrink-0">
                    <BankIcon bankId={bank.compe} size={26} borderRadius={4} />
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
          </div>
        </div>
      </div>
    </footer>
  );
};
