import React from 'react';
import { FaFilter, FaTimes, FaCar, FaCalendarAlt, FaDollarSign, FaMotorcycle, FaTruck } from 'react-icons/fa';

const YEAR_OPTIONS = [
  { label: 'Ano Mínimo', value: '' },
  { label: '2015 ou mais recente', value: '2015' },
  { label: '2018 ou mais recente', value: '2018' },
  { label: '2020 ou mais recente', value: '2020' },
  { label: '2022 ou mais recente', value: '2022' },
] as const;

const PRICE_OPTIONS = [
  { label: 'Preço Máximo', value: '' },
  { label: 'Até R$ 40.000', value: '40000' },
  { label: 'Até R$ 60.000', value: '60000' },
  { label: 'Até R$ 90.000', value: '90000' },
  { label: 'Até R$ 120.000', value: '120000' },
  { label: 'Até R$ 200.000', value: '200000' },
] as const;

interface FilterBarProps {
  tempFilters: { make: string; year: string; maxPrice: string; vehicleType: string };
  setTempFilters: React.Dispatch<React.SetStateAction<{ make: string; year: string; maxPrice: string; vehicleType: string }>>;
  applyFilters: () => void;
  clearFilters: () => void;
  availableMakes: string[];
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  tempFilters, setTempFilters, applyFilters, clearFilters, availableMakes, hasActiveFilters,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, field: keyof typeof tempFilters) => {
    setTempFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };
  const selectClass = 'w-full h-12 bg-brand-surface border border-gray-700 text-white pl-10 pr-4 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all text-sm font-medium appearance-none shadow-sm';
  const iconWrapperClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10';

  const getTypeIcon = () => {
    switch (tempFilters.vehicleType) {
      case 'motos': return <FaMotorcycle />;
      case 'caminhoes': return <FaTruck />;
      default: return <FaCar />;
    }
  };

  return (
    <section className="sticky top-16 md:top-20 z-30 bg-brand-darkRed/95 backdrop-blur-xl border-b border-gray-800 py-4 md:py-6 shadow-2xl transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 items-end">
          
          <div className="col-span-1 relative group">
            <label htmlFor="vehicleType" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Tipo</label>
            <div className="relative">
              <div className={iconWrapperClass}>{getTypeIcon()}</div>
              <select id="vehicleType" className={selectClass} value={tempFilters.vehicleType} onChange={(e) => handleChange(e, 'vehicleType')}>
                <option value="">Todos</option>
                <option value="carros">Carros</option>
                <option value="motos">Motos</option>
                <option value="caminhoes">Caminhões</option>
              </select>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-1 relative group">
            <label htmlFor="make" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Marca</label>
            <div className="relative">
              <div className={iconWrapperClass}><FaCar /></div>
              <select id="make" className={selectClass} value={tempFilters.make} onChange={(e) => handleChange(e, 'make')}>
                <option value="">Todas</option>
                {availableMakes.map((make) => (<option key={make} value={make}>{make}</option>))}
              </select>
            </div>
          </div>

          <div className="col-span-1 relative group">
            <label htmlFor="year" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Ano</label>
            <div className="relative">
              <div className={iconWrapperClass}><FaCalendarAlt /></div>
              <select id="year" className={selectClass} value={tempFilters.year} onChange={(e) => handleChange(e, 'year')}>
                {YEAR_OPTIONS.map(({ label, value }) => (<option key={value || 'any'} value={value}>{label}</option>))}
              </select>
            </div>
          </div>

          <div className="col-span-1 relative group">
            <label htmlFor="price" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Preço</label>
            <div className="relative">
              <div className={iconWrapperClass}><FaDollarSign /></div>
              <select id="price" className={selectClass} value={tempFilters.maxPrice} onChange={(e) => handleChange(e, 'maxPrice')}>
                {PRICE_OPTIONS.map(({ label, value }) => (<option key={value || 'any'} value={value}>{label}</option>))}
              </select>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 flex gap-2 h-12 mt-auto">
            <button onClick={applyFilters} className="flex-1 h-full bg-brand-orange hover:bg-brand-orangeHover text-white font-bold rounded-xl shadow-glow hover:shadow-orange-500/50 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
              <FaFilter className="text-sm" /> <span>Filtrar</span>
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="h-full px-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl active:scale-95 transition-all flex items-center justify-center">
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};