
import React from 'react';
import { Car } from '../types';

interface CarGridProps {
  cars: Car[];
  visibleCars: Car[];
  loading: boolean;
  openModal: (car: Car) => void;
  handleWhatsApp: (car: Car) => void;
  observerRef: React.RefObject<HTMLDivElement | null>;
  resetFilters: () => void;
  formatCurrency: (val: number) => string;
}

export const CarGrid: React.FC<CarGridProps> = ({ 
  cars, visibleCars, loading, openModal, handleWhatsApp, observerRef, resetFilters, formatCurrency 
}) => {
  return (
    <main id="inventory" className="container mx-auto px-4 py-12 flex-grow">
      {loading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-brand-surface rounded-lg h-96 animate-pulse border border-gray-800"></div>)}
         </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-20 text-gray-500 flex flex-col items-center">
          <i className="fa-solid fa-car-tunnel text-6xl mb-4 text-gray-700"></i>
          <p className="text-xl mb-4">Nenhum veículo encontrado no momento.</p>
          <button onClick={resetFilters} className="text-brand-orange underline">Limpar filtros</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {visibleCars.map(car => {
              const fipe = Number(car.fipeprice) || 0;
              const price = Number(car.price) || 0;
              const discount = fipe > 0 ? Math.round(((fipe - price) / fipe) * 100) : 0;
              const economy = fipe - price;

              return (
                <div 
                  key={car.id} 
                  onClick={() => openModal(car)}
                  className="bg-brand-surface border border-gray-700 rounded-2xl overflow-hidden group hover:border-brand-orange transition-all duration-300 flex flex-col hover:-translate-y-2 shadow-card cursor-pointer"
                >
                  {/* Image Section - Lazy Loaded */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                    <img 
                      src={car.image} 
                      alt={car.model} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" 
                      loading="lazy" 
                      decoding="async"
                      width="400"
                      height="300"
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }} 
                    />
                    
                    {discount > 0 && (
                      <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-2 rounded-bl-xl font-black text-lg shadow-lg z-10 flex flex-col items-center leading-none">
                        <span className="text-[10px] uppercase font-medium mb-0.5">Abaixo FIPE</span>
                        <span>-{discount}%</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-brand-surface to-transparent h-20"></div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col relative">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{car.make}</span>
                       <span className="bg-gray-800 text-gray-300 text-xs font-bold px-2 py-1 rounded border border-gray-600">{car.year}</span>
                    </div>

                    <h3 className="text-2xl font-black text-white leading-tight mb-4 group-hover:text-brand-orange transition-colors">
                      {car.model}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-6 bg-brand-dark/30 p-3 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2"><i className="fa-solid fa-gauge text-brand-orange"></i> {car.mileage.toLocaleString()} km</div>
                      <div className="flex items-center gap-2"><i className="fa-solid fa-gas-pump text-brand-orange"></i> {car.fuel}</div>
                      <div className="flex items-center gap-2"><i className="fa-solid fa-gears text-brand-orange"></i> {car.transmission}</div>
                      <div className="flex items-center gap-2"><i className="fa-solid fa-location-dot text-brand-orange"></i> {car.location ? car.location.split(',')[0] : 'Brasil'}</div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-800/50">
                      <div className="flex items-center justify-between mb-1">
                         <span className="text-xs text-gray-500 line-through">FIPE {formatCurrency(fipe)}</span>
                         {economy > 0 && <span className="text-green-500 text-xs font-bold">Economize {formatCurrency(economy)}</span>}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-black text-white tracking-tight">{formatCurrency(price)}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(car); }}
                          className="h-12 w-12 bg-green-600 border border-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-500 transition-all shadow-lg active:scale-90"
                        >
                          <i className="fa-brands fa-whatsapp text-2xl"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {visibleCars.length < cars.length && (
            <div ref={observerRef} className="h-20 flex items-center justify-center mt-8">
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce delay-100 mx-1"></div>
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce delay-200"></div>
            </div>
          )}
        </>
      )}
    </main>
  );
};
