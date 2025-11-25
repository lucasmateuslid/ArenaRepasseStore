
import React, { useState } from 'react';
import { Search, Phone } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  resetApp: () => void;
  handleWhatsApp: (car?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  resetApp,
  handleWhatsApp,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-darkRed border-b border-gray-800 shadow-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* LOGO SIMPLIFICADA */}
          <button
            onClick={resetApp}
            className="group flex items-center gap-1 outline-none focus:opacity-80 transition-opacity flex-shrink-0"
            aria-label="Arena Repasse - Voltar ao início"
          >
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white drop-shadow-sm transform -skew-x-6">
              ARENA
              <span className="text-brand-orange ml-1">
                REPASSE
              </span>
            </h1>
          </button>

          {/* BARRA DE BUSCA (Desktop) - Estilo Sólido */}
          <div className="hidden md:flex flex-1 max-w-lg mx-auto">
            <div className={`relative w-full transition-all duration-200 ${isFocused ? 'scale-[1.01]' : 'scale-100'}`}>
              <input
                type="text"
                placeholder="Buscar por marca, modelo, ano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full h-12 pl-4 pr-12 rounded-xl bg-brand-surface border border-gray-700 text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all shadow-inner"
              />
              
              {searchTerm && (
                <button 
                   onClick={() => setSearchTerm('')}
                   className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-times text-xs"></i>
                </button>
              )}
              
              <button
                onClick={handleSearch}
                className={`absolute right-1 top-1 h-10 w-10 rounded-lg flex items-center justify-center transition-all ${isFocused ? 'text-brand-orange' : 'text-gray-400 hover:text-white'}`}
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center gap-4 flex-shrink-0">

            {/* Desktop: Fale Conosco Sólido */}
            <button
              onClick={() => handleWhatsApp()}
              className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Phone size={18} className="fill-current" />
              <span>Fale Conosco</span>
            </button>

            {/* Mobile: Ícone Busca */}
             <button
              onClick={() => document.querySelector('input')?.focus()}
              className="md:hidden p-2 text-gray-300"
            >
              <Search size={24} />
            </button>

            {/* Mobile: Ícone WhatsApp */}
            <button
              onClick={() => handleWhatsApp()}
              className="md:hidden p-2 rounded-full bg-[#25D366] text-white shadow-lg active:scale-95 transition-all"
              aria-label="Abrir WhatsApp"
            >
              <Phone size={20} />
            </button>
          </div>
        </div>
        
        {/* Barra de Busca Mobile (Expandida) - Opcional se quiser busca no mobile abaixo do header */}
        <div className="md:hidden pb-4">
           <div className="relative">
              <input
                type="text"
                placeholder="Buscar veículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full h-10 pl-4 pr-10 rounded-lg bg-brand-surface border border-gray-700 text-white text-sm focus:border-brand-orange outline-none"
              />
              <button onClick={handleSearch} className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-400">
                <i className="fa-solid fa-arrow-right"></i>
              </button>
           </div>
        </div>
      </div>
    </header>
  );
};
