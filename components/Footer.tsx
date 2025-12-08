
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaMotorcycle, FaTruck, FaHome, FaWhatsapp } from 'react-icons/fa';
import BankIcon from './BankIcon';
import { useCompany } from '../contexts/CompanyContext';

interface FooterProps {
  handleWhatsApp: () => void;
  onQuickFilter: (type: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ handleWhatsApp, onQuickFilter }) => {
  const { settings } = useCompany();

  // Códigos COMPE Oficiais para mapeamento com o repo brazilian-banks-icons
  const banks = [
    { name: 'Santander', compe: 33 },   // 033.svg
    { name: 'BV Financeira', compe: 655 }, // 655.svg
    { name: 'Itaú', compe: 341 },       // 341.svg
    { name: 'Bradesco', compe: 237 },   // 237.svg
    { name: 'Banco Pan', compe: 623 },  // 623.svg
    { name: 'Safra', compe: 422 }       // 422.svg
  ];

  const handleNavigation = (type: string) => {
    onQuickFilter(type);
    document.getElementById('inventory')?.scrollIntoView({behavior: 'smooth'});
  };

  const formatWhatsApp = (num: string) => {
     if (!num) return '';
     return num.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4').replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return (
    <footer className="bg-brand-darkRed border-t border-red-800 text-gray-300 pt-16 pb-12 font-sans relative overflow-hidden">
      {/* Efeito de Fundo */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Coluna 1: Empresa & Legal */}
          <div className="space-y-4">
             <div className="text-2xl font-black italic tracking-tighter text-white">
              {settings?.company_name ? settings.company_name.split(' ')[0] : 'ARENA'}<span className="text-brand-orange">{settings?.company_name ? settings.company_name.replace(settings.company_name.split(' ')[0], '') : 'REPASSE'}</span>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              O maior estoque de repasse do Brasil. Conectando oportunidades a investidores e particulares com transparência e segurança.
            </p>
            <div className="pt-4 border-t border-white/10 mt-4">
               <p className="text-xs font-bold text-white/50 uppercase mb-1">Dados da Empresa</p>
               <p className="text-xs">{settings?.company_name || 'Arena Repasse Veículos Ltda.'}</p>
               <p className="text-xs">CNPJ: {settings?.cnpj || '12.345.678/0001-90'}</p>
               <p className="text-xs mt-1">{settings?.address || 'Av. das Nações Unidas, 1000 - SP'}</p>
            </div>
          </div>

          {/* Coluna 2: Navegação Visual (Ícones) */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm border-l-4 border-white pl-3">Estoque & Navegação</h4>
            <div className="flex gap-3">
               <button 
                 onClick={() => window.scrollTo(0,0)} 
                 className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group"
                 title="Início"
               >
                 <FaHome className="text-xl group-hover:text-brand-orange transition-colors"/>
               </button>
               <button 
                 onClick={() => handleNavigation('carros')} 
                 className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group"
                 title="Carros"
               >
                 <FaCar className="text-xl group-hover:text-brand-orange transition-colors"/>
               </button>
               <button 
                 onClick={() => handleNavigation('motos')} 
                 className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group"
                 title="Motos"
               >
                 <FaMotorcycle className="text-xl group-hover:text-brand-orange transition-colors"/>
               </button>
               <button 
                 onClick={() => handleNavigation('caminhoes')} 
                 className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group"
                 title="Caminhões"
               >
                 <FaTruck className="text-xl group-hover:text-brand-orange transition-colors"/>
               </button>
            </div>
            <div className="mt-4">
               <button onClick={handleWhatsApp} className="flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition">
                  <FaWhatsapp className="text-green-400"/> Falar com Consultor
               </button>
            </div>
          </div>

          {/* Coluna 3: Financiamento (Bancos) */}
          <div>
             <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm border-l-4 border-white pl-3">Financiamento</h4>
             <p className="text-xs mb-4 text-white/60">Trabalhamos com as principais financeiras do mercado para garantir a melhor taxa.</p>
             <div className="grid grid-cols-2 gap-2">
                {banks.map((bank, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded px-2 py-2 flex items-center gap-2 hover:bg-white/10 hover:border-brand-orange/50 transition group cursor-default">
                    <div className="flex-shrink-0">
                      <BankIcon bankId={bank.compe} size={28} borderRadius={4} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-white uppercase truncate">{bank.name}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Coluna 4: Contato */}
          <div>
             <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm border-l-4 border-white pl-3">Atendimento</h4>
             <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded bg-green-900/40 text-green-400 flex items-center justify-center flex-shrink-0 mt-1 border border-green-500/20">
                   <i className="fa-brands fa-whatsapp text-lg"></i>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-white/50 uppercase">WhatsApp Vendas</span>
                   <button onClick={handleWhatsApp} className="text-white hover:text-green-400 font-bold transition text-base">
                     {formatWhatsApp(settings?.phone_whatsapp || '11999999999')}
                   </button>
                 </div>
              </li>
              <li className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-1 border border-white/10">
                   <i className="fa-solid fa-envelope"></i>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-white/50 uppercase">Email</span>
                   <span className="text-white/80">{settings?.email || 'contato@arenarepasse.com.br'}</span>
                 </div>
              </li>
              <li className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-1 border border-white/10">
                   <i className="fa-solid fa-clock"></i>
                 </div>
                 <div>
                   <span className="block text-xs font-bold text-white/50 uppercase">Horário</span>
                   <span className="text-white/80 text-xs whitespace-pre-line">{settings?.opening_hours || 'Seg a Sex: 09h às 18h\nSáb: 09h às 13h'}</span>
                 </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
             <span>&copy; {new Date().getFullYear()} {settings?.company_name || 'Arena Repasse'}. Todos os direitos reservados.</span>
             <Link to="/admin" className="hover:text-white transition flex items-center gap-1">
               <i className="fa-solid fa-lock text-[10px]"></i> Restrito
             </Link>
          </div>

          <div className="flex gap-4 text-lg text-white/60">
             {settings?.social_instagram && (
               <a href={settings.social_instagram.startsWith('http') ? settings.social_instagram : `https://instagram.com/${settings.social_instagram.replace('@','')}`} target="_blank" rel="noreferrer">
                 <i className="fa-brands fa-instagram hover:text-white transition cursor-pointer"></i>
               </a>
             )}
             {settings?.social_facebook && (
               <a href={settings.social_facebook} target="_blank" rel="noreferrer">
                 <i className="fa-brands fa-facebook hover:text-white transition cursor-pointer"></i>
               </a>
             )}
             {settings?.social_youtube && (
               <a href={settings.social_youtube} target="_blank" rel="noreferrer">
                 <i className="fa-brands fa-youtube hover:text-white transition cursor-pointer"></i>
               </a>
             )}
          </div>
        </div>
      </div>
    </footer>
  );
};
