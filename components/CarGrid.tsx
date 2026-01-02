
import React from 'react';
import { Car } from '../types';
import { FaCalendarAlt, FaGasPump, FaTachometerAlt, FaWhatsapp, FaInfoCircle, FaMapMarkerAlt, FaCogs } from 'react-icons/fa';

interface CarGridProps {
  cars: Car[];
  visibleCars: Car[];
  loading: boolean;
  viewMode?: 'grid' | 'list';
  openModal: (car: Car) => void;
  handleWhatsApp: (car: Car) => void;
  observerRef: React.RefObject<HTMLDivElement | null> | null;
  resetFilters: () => void;
  formatCurrency: (val: number) => string;
}

export const CarGrid: React.FC<CarGridProps> = ({ 
  cars, visibleCars, loading, viewMode = 'grid', openModal, handleWhatsApp, observerRef, resetFilters, formatCurrency 
}) => {
  return (
    <section className="flex-grow">
      {loading ? (
         <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
           {[1,2,3,4,5,6].map(i => <div key={i} className={`bg-brand-surface rounded-3xl animate-pulse border border-gray-800 ${viewMode === 'grid' ? 'h-[450px]' : 'h-[200px]'}`}></div>)}
         </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-20 text-gray-500 flex flex-col items-center bg-brand-surface border border-gray-800 rounded-3xl shadow-xl">
          <i className="fa-solid fa-car-tunnel text-6xl mb-4 text-gray-800 animate-pulse"></i>
          <p className="text-lg font-black uppercase italic mb-2">Sem resultados</p>
          <p className="text-sm text-gray-600 mb-6">Tente ajustar seus filtros para encontrar novas ofertas.</p>
          <button onClick={resetFilters} className="bg-gray-800 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase hover:bg-gray-700 transition">Limpar filtros</button>
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}>
            {visibleCars.map((car, index) => {
              const fipe = Number(car.fipeprice) || 0;
              const price = Number(car.price) || 0;
              const discount = fipe > 0 ? Math.round(((fipe - price) / fipe) * 100) : 0;
              const economy = fipe - price;
              const isPriority = index < 4;
              const displayYear = car.year === 32000 ? 'Zero KM' : car.year;
              const carLocation = car.location || 'Brasil';

              if (viewMode === 'list') {
                return (
                  <div 
                    key={car.id}
                    onClick={() => openModal(car)}
                    className="bg-brand-surface border border-gray-800 rounded-3xl overflow-hidden group hover:border-brand-orange/40 transition-all duration-300 flex flex-col md:flex-row shadow-2xl cursor-pointer"
                  >
                    <div className="md:w-72 lg:w-80 h-48 md:h-auto relative overflow-hidden flex-shrink-0">
                      <img src={car.image} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />
                      {discount > 0 && <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full font-black text-[10px] shadow-lg z-10">-{discount}% FIPE</div>}
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-brand-orange text-[10px] font-black uppercase tracking-widest italic">{car.make}</span>
                            <h3 className="text-2xl font-black text-white group-hover:text-brand-orange transition-colors">{car.model}</h3>
                            <div className="flex flex-wrap gap-4 mt-2">
                               <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5"><FaCalendarAlt className="text-brand-orange"/> {displayYear}</span>
                               <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5"><FaTachometerAlt className="text-brand-orange"/> {car.mileage.toLocaleString()} KM</span>
                               <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5"><FaCogs className="text-brand-orange"/> {car.transmission}</span>
                               <span className="text-xs text-gray-400 font-bold flex items-center gap-1.5"><FaMapMarkerAlt className="text-brand-orange"/> {carLocation}</span>
                            </div>
                          </div>
                          <div className="text-right hidden sm:block">
                             <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Avaliação Fipe</p>
                             <p className="text-base font-bold text-gray-500 line-through decoration-red-600/30">{formatCurrency(fipe)}</p>
                             <p className="text-[10px] font-black text-brand-orange uppercase mt-3 italic">Oportunidade</p>
                             <p className="text-3xl font-black text-white">{formatCurrency(price)}</p>
                          </div>
                       </div>
                       <div className="flex gap-2 mt-auto">
                          <button onClick={(e) => { e.stopPropagation(); openModal(car); }} className="px-6 h-10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase rounded-xl border border-gray-800">Ver Ficha</button>
                          <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(car); }} className="flex-1 h-10 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg flex items-center justify-center gap-2"><FaWhatsapp size={16}/> Comprar no WhatsApp</button>
                       </div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={car.id} 
                  onClick={() => openModal(car)}
                  className="bg-brand-surface border border-gray-800 rounded-3xl overflow-hidden group hover:border-brand-orange/40 transition-all duration-500 flex flex-col hover:-translate-y-1 shadow-2xl cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                    <img 
                      src={car.image} 
                      alt={car.model} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" 
                      loading={isPriority ? "eager" : "lazy"}
                    />
                    
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full font-black text-[10px] shadow-lg z-10 flex items-center gap-1 border border-white/10 uppercase italic">
                        <span className="animate-pulse">-{discount}% FIPE</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-brand-surface via-brand-surface/20 to-transparent h-24"></div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="mb-4">
                       <div className="flex items-center justify-between">
                          <span className="text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] mb-1 block italic">{car.make}</span>
                          <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><FaMapMarkerAlt className="text-brand-orange text-[8px]"/> {carLocation}</span>
                       </div>
                       <h3 className="text-xl font-black text-white leading-tight mb-1 group-hover:text-brand-orange transition-colors truncate">
                         {car.model}
                       </h3>
                       <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider truncate italic">
                         <FaCogs className="inline mr-1 text-brand-orange"/> {car.transmission} • {car.fuel}
                       </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-800/50 mb-4 bg-black/10 rounded-xl px-2">
                      <div className="flex flex-col items-center text-center">
                        <FaCalendarAlt className="text-brand-orange text-xs mb-1" />
                        <span className="text-[10px] font-black text-white">{displayYear}</span>
                      </div>
                      <div className="flex flex-col items-center text-center border-x border-gray-800/50">
                        <FaTachometerAlt className="text-brand-orange text-xs mb-1" />
                        <span className="text-[10px] font-black text-white">{car.mileage.toLocaleString()} KM</span>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <FaGasPump className="text-brand-orange text-xs mb-1" />
                        <span className="text-[10px] font-black text-white truncate w-full px-1">{car.fuel}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {fipe > 0 && (
                        <div className="flex items-center justify-between mb-1 px-1">
                          <span className="text-[10px] font-black text-gray-600 uppercase">Avaliação Fipe</span>
                          <span className="text-sm font-bold text-gray-500 line-through decoration-red-600/30">
                            {formatCurrency(fipe)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-end justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest mb-0.5 italic">Preço de Repasse</span>
                          <span className="text-2xl font-black text-white tracking-tighter leading-none">
                            {formatCurrency(price)}
                          </span>
                        </div>
                        {economy > 0 && (
                          <div className="bg-green-600/10 border border-green-600/20 rounded-lg px-2 py-1 text-right">
                             <span className="block text-[8px] font-black text-green-500 uppercase">Margem</span>
                             <span className="text-xs font-black text-green-400">-{formatCurrency(economy)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(car); }}
                          className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase rounded-xl transition-all border border-gray-800 hover:border-gray-700 flex items-center justify-center gap-2 italic tracking-widest"
                        >
                          <FaInfoCircle /> Ver Mais
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(car); }}
                          className="h-10 w-10 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-500 transition-all shadow-lg active:scale-95 border border-green-500/50"
                          title="WhatsApp"
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
            <div ref={observerRef} className="h-32 flex flex-col items-center justify-center mt-8 gap-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-brand-orange rounded-full animate-bounce delay-200"></div>
              </div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Carregando mais ofertas</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};
