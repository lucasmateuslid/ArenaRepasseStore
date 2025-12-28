
import React from 'react';
import { Car } from '../types';
import { FaCalendarAlt, FaGasPump, FaTachometerAlt, FaWhatsapp, FaInfoCircle } from 'react-icons/fa';

interface CarGridProps {
  cars: Car[];
  visibleCars: Car[];
  loading: boolean;
  openModal: (car: Car) => void;
  handleWhatsApp: (car: Car) => void;
  observerRef: React.RefObject<HTMLDivElement | null> | null;
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
           {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-brand-surface rounded-2xl h-[450px] animate-pulse border border-gray-800"></div>)}
         </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-20 text-gray-500 flex flex-col items-center">
          <i className="fa-solid fa-car-tunnel text-6xl mb-4 text-gray-700"></i>
          <p className="text-xl mb-4">Nenhum veículo encontrado no momento.</p>
          <button onClick={resetFilters} className="text-brand-orange underline">Limpar filtros</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {visibleCars.map((car, index) => {
              const fipe = Number(car.fipeprice) || 0;
              const price = Number(car.price) || 0;
              const discount = fipe > 0 ? Math.round(((fipe - price) / fipe) * 100) : 0;
              const economy = fipe - price;
              const isPriority = index < 4;
              const displayYear = car.year === 32000 ? 'Zero KM' : car.year;

              return (
                <div 
                  key={car.id} 
                  onClick={() => openModal(car)}
                  className="bg-brand-surface border border-gray-800 rounded-3xl overflow-hidden group hover:border-brand-orange/50 transition-all duration-500 flex flex-col hover:-translate-y-2 shadow-card cursor-pointer"
                >
                  {/* Container da Imagem */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                    <img 
                      src={car.image} 
                      alt={car.model} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" 
                      loading={isPriority ? "eager" : "lazy"}
                    />
                    
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full font-black text-xs shadow-lg z-10 flex items-center gap-1 border border-white/10">
                        <span className="animate-pulse">-{discount}% FIPE</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-brand-surface via-brand-surface/20 to-transparent h-24"></div>
                  </div>
                  
                  {/* Informações do Veículo */}
                  <div className="p-5 pt-2 flex-grow flex flex-col">
                    <div className="mb-4">
                       <span className="text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 block">{car.make}</span>
                       <h3 className="text-2xl font-black text-white leading-tight mb-1 group-hover:text-brand-orange transition-colors">
                         {car.model}
                       </h3>
                       <p className="text-gray-500 text-xs font-medium truncate italic">
                         {car.description?.split('\n')[0] || car.transmission}
                       </p>
                    </div>

                    {/* GRADE DE ATRIBUTOS (Estilo Referência) */}
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-800/50 mb-5">
                      <div className="flex flex-col items-center text-center">
                        <FaCalendarAlt className="text-brand-orange text-lg mb-1.5" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Ano</span>
                        <span className="text-xs font-black text-white">{displayYear}</span>
                      </div>
                      <div className="flex flex-col items-center text-center border-x border-gray-800/50">
                        <FaTachometerAlt className="text-brand-orange text-lg mb-1.5" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Km</span>
                        <span className="text-xs font-black text-white">{car.mileage.toLocaleString()} KM</span>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <FaGasPump className="text-brand-orange text-lg mb-1.5" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Combustível</span>
                        <span className="text-xs font-black text-white">{car.fuel.split('/')[0]}</span>
                      </div>
                    </div>

                    {/* SEÇÃO DE PREÇO (DESTAQUE MÁXIMO) */}
                    <div className="mt-auto">
                      {fipe > 0 && (
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[10px] font-black text-gray-600 uppercase">Avaliação Fipe</span>
                          <span className="text-sm font-bold text-gray-400 line-through decoration-red-500/50">
                            {formatCurrency(fipe)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-end justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">Preço de Repasse</span>
                          <span className="text-3xl font-black text-white tracking-tighter leading-none">
                            {formatCurrency(price)}
                          </span>
                        </div>
                        {economy > 0 && (
                          <div className="bg-green-600/10 border border-green-600/30 rounded-lg px-2.5 py-1.5 text-right">
                             <span className="block text-[9px] font-black text-green-500 uppercase">Economize</span>
                             <span className="text-sm font-black text-green-400">-{formatCurrency(economy)}</span>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(car); }}
                          className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase rounded-xl transition-all border border-gray-800 hover:border-gray-700 flex items-center justify-center gap-2"
                        >
                          <FaInfoCircle /> Ver Mais
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(car); }}
                          className="h-11 w-11 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-500 transition-all shadow-lg active:scale-95 border border-green-500/50"
                          title="Negociar no WhatsApp"
                        >
                          <FaWhatsapp className="text-xl" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {observerRef && (
            <div ref={observerRef} className="h-24 flex items-center justify-center mt-12">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-brand-orange rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-brand-orange rounded-full animate-bounce delay-100"></div>
                <div className="w-2.5 h-2.5 bg-brand-orange rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
};
