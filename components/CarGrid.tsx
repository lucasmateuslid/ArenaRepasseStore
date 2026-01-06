
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
  if (loading && cars.length === 0) {
    return (
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
        {[1,2,3,4,5,6].map(i => <div key={i} className={`bg-brand-surface rounded-3xl animate-pulse border border-gray-800 ${viewMode === 'grid' ? 'h-[400px]' : 'h-[180px]'}`}></div>)}
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-24 bg-brand-surface border border-gray-800 rounded-3xl">
        <FaMapMarkerAlt className="text-5xl mx-auto mb-4 text-gray-800" />
        <p className="text-sm font-black text-white uppercase italic">Nenhum veículo encontrado</p>
        <button onClick={resetFilters} className="mt-4 text-[10px] font-bold text-brand-orange uppercase hover:underline">Limpar filtros</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}>
        {visibleCars.map((car) => {
          const discount = car.fipeprice > 0 ? Math.round(((car.fipeprice - car.price) / car.fipeprice) * 100) : 0;
          
          return (
            <div 
              key={car.id} 
              onClick={() => openModal(car)}
              className={`bg-brand-surface border border-gray-800 rounded-3xl overflow-hidden group hover:border-brand-orange/40 transition-all duration-300 shadow-2xl cursor-pointer ${viewMode === 'list' ? 'flex flex-col md:flex-row' : ''}`}
            >
              <div className={`${viewMode === 'list' ? 'md:w-72' : 'aspect-[4/3]'} relative overflow-hidden bg-zinc-950`}>
                <img src={car.image} alt={car.model} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" loading="lazy" />
                {discount > 10 && <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full font-black text-[10px] italic shadow-lg">-{discount}% FIPE</div>}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="text-brand-orange text-[9px] font-black uppercase tracking-widest block mb-1">{car.make}</span>
                  <h3 className="text-lg font-black text-white truncate group-hover:text-brand-orange transition-colors">{car.model}</h3>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><FaCalendarAlt className="text-brand-orange"/> {car.year === 32000 ? 'Zero' : car.year}</span>
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><FaTachometerAlt className="text-brand-orange"/> {car.mileage.toLocaleString()} KM</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <span className="text-[8px] font-black text-gray-600 uppercase block">Repasse Especial</span>
                      <span className="text-xl font-black text-white">{formatCurrency(car.price)}</span>
                    </div>
                    {car.fipeprice > 0 && <span className="text-[10px] font-bold text-gray-500 line-through mb-1">{formatCurrency(car.fipeprice)}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openModal(car); }} className="flex-1 h-10 bg-white/5 border border-gray-800 rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/10 transition">Detalhes</button>
                    <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(car); }} className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white hover:bg-green-500 transition shadow-lg"><FaWhatsapp size={18}/></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {observerRef && <div ref={observerRef} className="h-20 flex items-center justify-center text-brand-orange animate-pulse"><FaInfoCircle className="animate-spin" /></div>}
    </div>
  );
};
