
import React, { useState } from 'react';
import { 
  FaFilter, FaTimes, FaCar, FaCalendarAlt, FaMotorcycle, FaTruck, 
  FaLayerGroup, FaMapMarkerAlt, FaChevronDown, FaSearch, FaDollarSign, FaTachometerAlt 
} from 'react-icons/fa';

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
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    location: true,
    brand: true,
    year: true,
    price: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTypeChange = (type: string) => {
    setTempFilters(prev => ({ ...prev, vehicleType: type, make: '', year: '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>, field: keyof typeof tempFilters) => {
    setTempFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const categories = [
    { id: '', label: 'Tudo', icon: FaLayerGroup },
    { id: 'carros', label: 'Carros', icon: FaCar },
    { id: 'motos', label: 'Motos', icon: FaMotorcycle },
    { id: 'caminhoes', label: 'Pesados', icon: FaTruck },
  ];

  const SectionHeader = ({ title, section, icon: Icon }: any) => (
    <button 
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-4 border-b border-gray-800 hover:text-white transition group"
    >
      <div className="flex items-center gap-3">
        <Icon className="text-brand-orange text-xs group-hover:scale-110 transition" />
        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition">{title}</span>
      </div>
      <FaChevronDown className={`text-[10px] text-gray-600 transition-transform duration-300 ${expandedSections[section as keyof typeof expandedSections] ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 shadow-xl space-y-2 sticky top-24">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FaFilter className="text-brand-orange text-sm" />
          <h3 className="text-sm font-black text-white uppercase italic">Filtrar</h3>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-[10px] font-bold text-gray-500 hover:text-white transition uppercase">Limpar</button>
        )}
      </div>

      {/* SEÇÃO: TIPO DE VEÍCULO */}
      <div className="space-y-4">
        <SectionHeader title="Categoria" section="type" icon={FaCar} />
        {expandedSections.type && (
          <div className="grid grid-cols-2 gap-2 pt-2 animate-fade-in">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleTypeChange(cat.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5
                  ${tempFilters.vehicleType === cat.id 
                    ? 'bg-brand-orange/10 border-brand-orange text-white shadow-glow' 
                    : 'bg-black/20 border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
              >
                <cat.icon className="text-base" />
                <span className="text-[9px] font-black uppercase">{cat.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO: LOCALIZAÇÃO */}
      <div className="space-y-4">
        <SectionHeader title="Localização" section="location" icon={FaMapMarkerAlt} />
        {expandedSections.location && (
          <div className="pt-2 animate-fade-in">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
              <input 
                type="text" 
                placeholder="Cidade ou Estado"
                className="w-full bg-black/40 border border-gray-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:border-brand-orange outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO: MARCA */}
      <div className="space-y-4">
        <SectionHeader title="Marca" section="brand" icon={FaLayerGroup} />
        {expandedSections.brand && (
          <div className="pt-2 animate-fade-in max-h-48 overflow-y-auto no-scrollbar space-y-1">
            <select 
              value={tempFilters.make} 
              onChange={(e) => handleChange(e, 'make')}
              className="w-full bg-black/40 border border-gray-800 rounded-xl py-2.5 px-3 text-xs text-white focus:border-brand-orange outline-none appearance-none"
            >
              <option value="">Todas as Marcas</option>
              {availableMakes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* SEÇÃO: ANO */}
      <div className="space-y-4">
        <SectionHeader title="Ano Mínimo" section="year" icon={FaCalendarAlt} />
        {expandedSections.year && (
          <div className="pt-2 animate-fade-in">
            <select 
              value={tempFilters.year} 
              onChange={(e) => handleChange(e, 'year')}
              className="w-full bg-black/40 border border-gray-800 rounded-xl py-2.5 px-3 text-xs text-white focus:border-brand-orange outline-none appearance-none"
            >
              <option value="">A partir de...</option>
              {availableYears.map(y => <option key={y} value={y}>{y === 32000 ? 'Zero KM' : y}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* SEÇÃO: PREÇO */}
      <div className="space-y-4">
        <SectionHeader title="Preço Máximo" section="price" icon={FaDollarSign} />
        {expandedSections.price && (
          <div className="pt-2 animate-fade-in space-y-4">
            <input 
              type="range" 
              min="0" 
              max="1000000" 
              step="5000"
              value={tempFilters.maxPrice}
              onChange={(e) => setTempFilters(prev => ({...prev, maxPrice: e.target.value}))}
              className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-brand-orange"
            />
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
              <span>R$ 0</span>
              <span className="text-white">Até {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(tempFilters.maxPrice))}</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <button 
          onClick={applyFilters}
          className="w-full py-4 bg-brand-orange hover:bg-brand-orangeHover text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-glow transition transform active:scale-95 flex items-center justify-center gap-2 italic"
        >
          <FaFilter /> Aplicar Filtros
        </button>
      </div>
    </div>
  );
};
