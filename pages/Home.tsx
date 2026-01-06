
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { Car, FilterOptions, Seller } from '../types';
import { fetchCars, fetchSellers, fetchAvailableBrands, fetchAvailableYears, parseError } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext'; 
import { encodeCarUrl, decodeCarIdFromUrl } from '../utils/urlHelpers'; 
import { FaSortAmountDown, FaThList, FaThLarge } from 'react-icons/fa';

import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { SpecialOffers } from '../components/SpecialOffers';
import { FilterBar } from '../components/FilterBar';
import { CarGrid } from '../components/CarGrid';
import { CarModal } from '../components/CarModal';
import { ChatWidget } from '../components/ChatWidget';
import { Footer } from '../components/Footer';

const ITEMS_PER_PAGE = 12;

export const Home = () => {
  const { settings } = useCompany(); 
  
  const [cars, setCars] = useState<Car[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('newest'); 
  
  const [tempFilters, setTempFilters] = useState({ 
    make: '', 
    minPrice: '0', 
    maxPrice: '1000000', 
    year: '', 
    vehicleType: '' 
  });
  
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const loadFiltersData = useCallback(async (type?: string) => {
    const [brands, years] = await Promise.all([
      fetchAvailableBrands(type),
      fetchAvailableYears(type)
    ]);
    setAvailableMakes(brands);
    setAvailableYears(years);
  }, []);

  const loadInventory = useCallback(async (isReset = false) => {
    if (isReset) {
      setLoading(true);
      setPage(0);
    } else {
      setIsLoadingMore(true);
    }

    const currentPage = isReset ? 0 : page;
    const { data, error, count } = await fetchCars({
      ...tempFilters,
      search: searchTerm,
      status: 'available'
    }, currentPage, ITEMS_PER_PAGE);
    
    if (error) {
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    let newCars = data || [];
    if (orderBy === 'price_asc') newCars.sort((a,b) => a.price - b.price);
    if (orderBy === 'price_desc') newCars.sort((a,b) => b.price - a.price);

    setTotalCount(count || 0);
    setCars(prev => isReset ? newCars : [...prev, ...newCars]);
    setHasMore(newCars.length >= ITEMS_PER_PAGE);
    setLoading(false);
    setIsLoadingMore(false);
    setPage(p => isReset ? 1 : p + 1);
  }, [tempFilters, searchTerm, page, orderBy]);

  useEffect(() => {
    loadInventory(true);
    loadFiltersData(tempFilters.vehicleType);
  }, [tempFilters.vehicleType, tempFilters.make, tempFilters.year, searchTerm, orderBy]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
        loadInventory(false);
      }
    }, { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loading, loadInventory]);

  useEffect(() => {
    const prettyUrl = searchParams.get('v');
    const targetId = prettyUrl ? decodeCarIdFromUrl(prettyUrl) : searchParams.get('carId');
    
    if (!loading) {
      if (targetId) {
        const found = cars.find(c => c.id === targetId);
        if (found) {
          setSelectedCar(found);
        }
      } else {
        // Se não houver ID na URL, fecha o modal limpando o estado
        setSelectedCar(null);
      }
    }
  }, [loading, cars, searchParams]);

  const resetApp = () => {
    setTempFilters({ make: '', minPrice: '0', maxPrice: '1000000', year: '', vehicleType: '' });
    setSearchTerm('');
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickFilter = (type: string) => {
    setTempFilters({ make: '', minPrice: '0', maxPrice: '1000000', year: '', vehicleType: type });
  };

  const handleOpenModal = (car: Car) => {
    setSearchParams({ v: encodeCarUrl(car.id, car.make, car.model, car.year) });
  };

  const handleWhatsApp = (car?: Car) => {
    const phone = (settings?.phone_whatsapp || "84996697575").replace(/\D/g, '');
    const text = car 
      ? `Olá! Tenho interesse no ${car.make} ${car.model} ${car.year === 32000 ? 'Zero KM' : car.year}.`
      : "Olá! Gostaria de conhecer o estoque da Arena Repasse.";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={() => loadInventory(true)} resetApp={resetApp} handleWhatsApp={handleWhatsApp} />
      <Hero />
      
      {cars.length > 0 && <SpecialOffers cars={cars} openModal={handleOpenModal} handleWhatsApp={handleWhatsApp} formatCurrency={v => `R$ ${v.toLocaleString()}`} />}

      <div id="inventory" className="container mx-auto px-4 py-8">
         <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-72 flex-shrink-0">
               <FilterBar 
                tempFilters={tempFilters}
                setTempFilters={setTempFilters}
                applyFilters={() => loadInventory(true)}
                clearFilters={resetApp}
                availableMakes={availableMakes}
                availableYears={availableYears}
                hasActiveFilters={Boolean(tempFilters.make || tempFilters.year || tempFilters.vehicleType || searchTerm)}
              />
            </aside>

            <div className="flex-1">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-brand-surface border border-gray-800 p-4 rounded-2xl gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white italic uppercase">Estoque Disponível</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{totalCount} veículos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={orderBy} onChange={e => setOrderBy(e.target.value)} className="bg-black/40 border border-gray-700 text-white text-[11px] font-black uppercase rounded-xl px-4 py-2.5 outline-none appearance-none cursor-pointer">
                       <option value="newest">Novidades</option>
                       <option value="price_asc">Menor Preço</option>
                       <option value="price_desc">Maior Preço</option>
                    </select>
                    <div className="hidden sm:flex bg-black/40 border border-gray-700 rounded-xl p-1 gap-1">
                       <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'text-brand-orange bg-brand-orange/10' : 'text-gray-600'}`}><FaThLarge size={14}/></button>
                       <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'text-brand-orange bg-brand-orange/10' : 'text-gray-600'}`}><FaThList size={14}/></button>
                    </div>
                  </div>
               </div>

               <CarGrid 
                  cars={cars} visibleCars={cars} loading={loading} viewMode={viewMode}
                  openModal={handleOpenModal} handleWhatsApp={handleWhatsApp}
                  observerRef={hasMore ? observerTarget : null} resetFilters={resetApp}
                  formatCurrency={v => `R$ ${v.toLocaleString()}`}
                />
            </div>
         </div>
      </div>

      <CarModal car={selectedCar} onClose={() => setSearchParams({})} handleWhatsApp={handleWhatsApp} formatCurrency={v => `R$ ${v.toLocaleString()}`} />
      <Footer handleWhatsApp={() => handleWhatsApp()} onQuickFilter={handleQuickFilter} />
      <ChatWidget isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} cars={cars.slice(0, 10)} openModal={handleOpenModal} formatCurrency={v => `R$ ${v.toLocaleString()}`} />
    </div>
  );
}
