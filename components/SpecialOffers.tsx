
import React, { useMemo } from 'react';
import { Car } from '../types';

interface SpecialOffersProps {
  cars: Car[];
  openModal: (car: Car) => void;
  handleWhatsApp: (car: Car) => void;
  formatCurrency: (val: number) => string;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({ 
  cars, 
  openModal, 
  handleWhatsApp, 
  formatCurrency 
}) => {
  // Lógica: Filtra > 17% de desconto, Ordena decrescente, Pega Top 3
  const specialCars = useMemo(() => {
    return cars
      .map(car => {
        // Proteção contra NaN: Se fipeprice for 0 ou nulo, considera desconto 0
        const fipe = Number(car.fipeprice) || 0;
        const price = Number(car.price) || 0;
        const discountPercent = fipe > 0 ? Math.round(((fipe - price) / fipe) * 100) : 0;
        
        return {
          ...car,
          discountPercent
        };
      })
      .filter(car => car.discountPercent > 17)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 3);
  }, [cars]);

  if (specialCars.length === 0) return null;

  return (
    <section className="bg-brand-dark relative z-20 -mt-8 mb-8">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-b from-brand-surface/50 to-brand-dark border border-gray-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
               <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                 <i className="fa-solid fa-star animate-spin-slow"></i> Oportunidades Únicas
               </div>
               <h2 className="text-3xl md:text-5xl font-black italic text-white tracking-tighter">
                 SONHOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">IMPERDÍVEIS</span>
               </h2>
            </div>
            <p className="text-gray-400 text-sm md:text-base max-w-md text-center md:text-right">
              Seleção exclusiva de veículos com mais de <strong className="text-white">20% de desconto</strong> abaixo da tabela FIPE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {specialCars.map(car => (
              <div 
                key={car.id}
                onClick={() => openModal(car)}
                className="bg-brand-surface border border-yellow-500/30 rounded-2xl overflow-hidden group hover:border-yellow-400 transition-all duration-300 flex flex-col hover:-translate-y-2 shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] cursor-pointer relative"
              >
                {/* Badge de Super Oferta */}
                <div className="absolute top-3 left-3 z-20 bg-yellow-400 text-black font-black text-xs px-3 py-1 rounded shadow-lg flex items-center gap-1 animate-pulse">
                  <i className="fa-solid fa-bolt"></i> SUPER OFERTA
                </div>

                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                  <img 
                    src={car.image} 
                    alt={car.model} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" 
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }}
                  />
                  
                  {/* Etiqueta de Desconto Gigante */}
                  <div className="absolute bottom-0 right-0 bg-yellow-500 text-black px-4 py-2 rounded-tl-2xl font-black text-xl shadow-lg z-10 leading-none">
                    -{car.discountPercent}% OFF
                  </div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">{car.make}</span>
                     <span className="bg-gray-800 text-gray-300 text-xs font-bold px-2 py-1 rounded">{car.year}</span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-tight mb-2 group-hover:text-yellow-400 transition-colors truncate">
                    {car.model}
                  </h3>
                  
                  <div className="mt-auto border-t border-gray-700/50 pt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                       <span className="line-through">FIPE {formatCurrency(car.fipeprice)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-white tracking-tight">{formatCurrency(car.price)}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(car); }}
                        className="h-10 w-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:brightness-110 transition-all shadow-lg active:scale-90"
                      >
                        <i className="fa-brands fa-whatsapp text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
