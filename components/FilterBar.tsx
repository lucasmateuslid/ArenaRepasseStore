
import React from 'react';
import { FaFilter, FaTimes, FaCar, FaCalendarAlt, FaMotorcycle, FaTruck, FaLayerGroup } from 'react-icons/fa';

interface FilterBarProps {
  tempFilters: { make: string; year: string; minPrice: string; maxPrice: string; vehicleType: string };
  setTempFilters: React.Dispatch<React.SetStateAction<{ make: string; year: string; minPrice: string; maxPrice: string; vehicleType: string }>>;
  applyFilters: () => void;
  clearFilters: () => void;
  availableMakes: string[];
  availableYears: number[];
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  tempFilters, setTempFilters, applyFilters, clearFilters, availableMakes, availableYears, hasActiveFilters,
}) => {
  const minVal = parseInt(tempFilters.minPrice) || 0;
  const maxVal = parseInt(tempFilters.maxPrice) || 500000;
  const RANGE_MAX = 500000;

  // Função para troca de categoria com disparo automático e limpeza de marca
  const handleTypeChange = (type: string) => {
    setTempFilters(prev => ({ 
      ...prev, 
      vehicleType: type, 
      make: '', // Limpa a marca ao trocar o tipo de veículo
      year: ''  // Opcional: limpa o ano para uma busca mais limpa por categoria
    }));
    // O useEffect no Home.tsx detectará a mudança no tempFilters e chamará loadInventory(true) automaticamente
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, field: keyof typeof tempFilters) => {
    setTempFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxVal - 10000);
    setTempFilters(prev => ({ ...prev, minPrice: value.toString() }));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minVal + 10000);
    setTempFilters(prev => ({ ...prev, maxPrice: value.toString() }));
  };

  const formatPrice = (val: number) => {
    if (val >= 1000) return `R$ ${Math.round(val / 1000)}k`;
    return `R$ ${val}`;
  };

  const selectClass = 'w-full h-12 bg-black/40 border border-gray-800 text-white pl-10 pr-4 rounded-xl focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50 outline-none transition-all text-sm font-bold appearance-none hover:border-gray-700';
  const iconWrapperClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10';

  const categories = [
    { id: '', label: 'Tudo', icon: FaLayerGroup },
    { id: 'carros', label: 'Carros', icon: FaCar },
    { id: 'motos', label: 'Motos', icon: FaMotorcycle },
    { id: 'caminhoes', label: 'Pesados', icon: FaTruck },
  ];

  const minPercent = (minVal / RANGE_MAX) * 100;
  const maxPercent = (maxVal / RANGE_MAX) * 100;

  return (
    <section className="sticky top-16 md:top-20 z-30 bg-brand-darkRed/95 backdrop-blur-xl border-b border-gray-800 pt-4 pb-6 shadow-2xl transition-all duration-300">
      <div className="container mx-auto px-4">
        
        {/* CABEÇALHO DAS CATEGORIAS (FILTROS INDEPENDENTES) */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
            {categories.map((cat) => {
              const isActive = tempFilters.vehicleType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleTypeChange(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 transition-all duration-300 whitespace-nowrap group
                    ${isActive 
                      ? 'bg-brand-orange border-brand-orange text-white shadow-glow scale-105 z-10' 
                      : 'bg-brand-surface border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                >
                  <cat.icon className={`${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="text-xs font-black uppercase tracking-wider">{cat.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></div>
            Seleção Inteligente
          </div>
        </div>

        {/* GRUPO DE FILTROS TÉCNICOS E PREÇO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end bg-black/20 p-4 md:p-6 rounded-3xl border border-gray-800/50">
          
          {/* ESPECIFICAÇÕES */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="relative group">
              <label htmlFor="make" className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Marca</label>
              <div className="relative">
                <div className={iconWrapperClass}><FaCar /></div>
                <select id="make" className={selectClass} value={tempFilters.make} onChange={(e) => handleChange(e, 'make')}>
                  <option value="">Qualquer Marca</option>
                  {availableMakes.map((make) => (<option key={make} value={make}>{make}</option>))}
                </select>
              </div>
            </div>

            <div className="relative group">
              <label htmlFor="year" className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">A partir de</label>
              <div className="relative">
                <div className={iconWrapperClass}><FaCalendarAlt /></div>
                <select id="year" className={selectClass} value={tempFilters.year} onChange={(e) => handleChange(e, 'year')}>
                  <option value="">Qualquer Ano</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year === 32000 ? 'Zero KM' : year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SLIDER DE PREÇO */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Faixa de Investimento</label>
              <span className="text-[10px] font-black text-white bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                {formatPrice(minVal)} — {formatPrice(maxVal)}
              </span>
            </div>
            <div className="relative h-8 flex items-center px-1">
              <div className="absolute w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-brand-orange shadow-glow transition-all" 
                  style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max={RANGE_MAX}
                step="5000"
                value={minVal}
                onChange={handleMinChange}
                className="absolute w-full h-1 opacity-0 z-20 pointer-events-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto"
                style={{ WebkitAppearance: 'none' }}
              />
              <input
                type="range"
                min="0"
                max={RANGE_MAX}
                step="5000"
                value={maxVal}
                onChange={handleMaxChange}
                className="absolute w-full h-1 opacity-0 z-20 pointer-events-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto"
                style={{ WebkitAppearance: 'none' }}
              />
              <div className="absolute w-full flex items-center pointer-events-none h-1.5">
                <div 
                  className="absolute w-4 h-4 bg-white border-2 border-brand-orange rounded-full shadow-lg pointer-events-none z-30 transition-transform active:scale-125"
                  style={{ left: `calc(${minPercent}% - 8px)` }}
                ></div>
                <div 
                  className="absolute w-4 h-4 bg-white border-2 border-brand-orange rounded-full shadow-lg pointer-events-none z-30 transition-transform active:scale-125"
                  style={{ left: `calc(${maxPercent}% - 8px)` }}
                ></div>
              </div>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="lg:col-span-3 flex gap-2 h-12">
            <button onClick={applyFilters} className="flex-1 h-full bg-brand-orange hover:bg-brand-orangeHover text-white font-black rounded-2xl shadow-glow transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95">
              <FaFilter className="text-sm" /> <span>Aplicar</span>
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="h-full px-5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white rounded-2xl active:scale-95 transition-all flex items-center justify-center" title="Limpar Filtros">
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        input[type=range]::-webkit-slider-thumb {
          pointer-events: all;
          width: 24px;
          height: 24px;
          -webkit-appearance: none;
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: all;
          width: 24px;
          height: 24px;
          border: none;
        }
      `}} />
    </section>
  );
};
