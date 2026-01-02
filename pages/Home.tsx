
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { Car, FilterOptions, Seller } from '../types';
import { fetchCars, fetchSellers, fetchAvailableBrands, fetchAvailableYears, fetchSpecialOffers, parseError } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext'; 
import { encodeCarUrl, decodeCarIdFromUrl } from '../utils/urlHelpers'; 
import { FaSortAmountDown, FaThList, FaThLarge } from 'react-icons/fa';

// Importing Components
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
  const [specialOffersCars, setSpecialOffersCars] = useState<Car[]>([]);
  
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
  const [sellers, setSellers] = useState<Seller[]>([]);

  const loadFiltersData = useCallback(async (vehicleType?: string) => {
    const brands = await fetchAvailableBrands(vehicleType);
    const years = await fetchAvailableYears(vehicleType);
    setAvailableMakes(brands);
    setAvailableYears(years);
  }, []);

  useEffect(() => {
    const initData = async () => {
       const offersData = await fetchSpecialOffers();
       setSpecialOffersCars(offersData);
       const sellersRes = await fetchSellers();
       if (sellersRes.data) setSellers(sellersRes.data);
       await loadFiltersData();
    };
    initData();
  }, [loadFiltersData]);

  const loadInventory = useCallback(async (isReset = false) => {
    if (isReset) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    const currentPage = isReset ? 0 : page;
    const filters: FilterOptions = {
       ...tempFilters,
       search: searchTerm,
       status: 'available' 
    };

    const { data, error, count } = await fetchCars(filters, currentPage, ITEMS_PER_PAGE);
    
    if (error) {
      console.error("Erro ao buscar carros:", parseError(error));
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    let newCars = data || [];
    
    // Simulação de ordenação local se o Supabase não prover via query direta complexa
    if (orderBy === 'price_asc') newCars.sort((a,b) => a.price - b.price);
    if (orderBy === 'price_desc') newCars.sort((a,b) => b.price - a.price);
    if (orderBy === 'km_asc') newCars.sort((a,b) => a.mileage - b.mileage);

    setTotalCount(count || 0);
    
    if (isReset) {
      setCars(newCars);
    } else {
      setCars(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const filteredNew = newCars.filter(c => !existingIds.has(c.id));
        return [...prev, ...filteredNew];
      });
    }

    setHasMore(newCars.length >= ITEMS_PER_PAGE);
    setLoading(false);
    setIsLoadingMore(false);
    setPage(prev => isReset ? 1 : prev + 1);
  }, [tempFilters, searchTerm, page, orderBy]);

  useEffect(() => {
    loadInventory(true);
  }, [tempFilters, searchTerm, orderBy]); 

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          loadInventory(false);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [hasMore, isLoadingMore, loading, loadInventory]);

  useEffect(() => {
    const prettyUrl = searchParams.get('v');
    let targetId = searchParams.get('carId') || (prettyUrl ? decodeCarIdFromUrl(prettyUrl) : null);

    if (!loading && targetId) {
      const foundCar = cars.find(c => c.id === targetId) || specialOffersCars.find(c => c.id === targetId);
      if (foundCar && selectedCar?.id !== targetId) setSelectedCar(foundCar);
    } else if (!loading && !targetId && selectedCar) {
      setSelectedCar(null);
    }
  }, [loading, cars, specialOffersCars, searchParams, selectedCar]);

  // Atualiza marcas disponíveis quando troca de categoria
  useEffect(() => {
    loadFiltersData(tempFilters.vehicleType);
    if (tempFilters.make) setTempFilters(prev => ({ ...prev, make: '' })); 
  }, [tempFilters.vehicleType, loadFiltersData]);

  const applyFilters = () => loadInventory(true);
  const clearFilters = () => {
    setTempFilters({ make: '', minPrice: '0', maxPrice: '1000000', year: '', vehicleType: '' });
    setSearchTerm(''); 
  };

  const handleSearch = () => loadInventory(true);
  const resetApp = () => {
    clearFilters();
    setSearchParams({}); 
    window.scrollTo(0,0);
  }

  const handleQuickFilter = (type: string) => {
    setTempFilters(prev => ({ ...prev, vehicleType: type, make: '', year: '' }));
  };

  const handleOpenModal = (car: Car) => {
    setSearchParams(prev => {
      prev.set('v', encodeCarUrl(car.id, car.make, car.model, car.year));
      prev.delete('carId'); 
      return prev;
    });
  };

  const handleCloseModal = () => setSearchParams(prev => { prev.delete('carId'); prev.delete('v'); return prev; });

  const handleWhatsApp = (car?: Car) => {
    const phone = (settings?.phone_whatsapp || "5511999999999").replace(/\D/g, '');
    let text = car 
      ? `Olá! Estou interessado no *${car.make} ${car.model} ${car.year}*. Poderia me passar mais informações?\n\nLink: ${window.location.origin}${window.location.pathname}#/?v=${encodeCarUrl(car.id, car.make, car.model, car.year)}`
      : "Olá! Gostaria de saber mais sobre o estoque da Arena Repasse.";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={handleSearch} resetApp={resetApp} handleWhatsApp={handleWhatsApp} />
      
      <Hero />

      {specialOffersCars.length > 0 && (
        <SpecialOffers cars={specialOffersCars} openModal={handleOpenModal} handleWhatsApp={handleWhatsApp} formatCurrency={formatCurrency} />
      )}

      <div id="inventory" className="container mx-auto px-4 py-8">
         <div className="flex flex-col lg:flex-row gap-8">
            
            <aside className="w-full lg:w-72 flex-shrink-0">
               <FilterBar 
                tempFilters={tempFilters}
                setTempFilters={setTempFilters}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
                availableMakes={availableMakes}
                availableYears={availableYears}
                hasActiveFilters={Boolean(tempFilters.make || tempFilters.year || tempFilters.vehicleType || searchTerm)}
              />
            </aside>

            <div className="flex-1 flex flex-col">
               
               {/* Barra de Ferramentas do Estoque */}
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-brand-surface border border-gray-800 p-4 rounded-2xl gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white italic">RESULTADOS</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{totalCount} veículos encontrados</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                       <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange text-xs"/>
                       <select 
                         value={orderBy}
                         onChange={(e) => setOrderBy(e.target.value)}
                         className="bg-black/40 border border-gray-700 text-white text-[11px] font-black uppercase rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-brand-orange appearance-none cursor-pointer min-w-[180px]"
                       >
                         <option value="newest">Mais Recentes</option>
                         <option value="price_asc">Menor Preço</option>
                         <option value="price_desc">Maior Preço</option>
                         <option value="km_asc">Menor KM</option>
                       </select>
                    </div>
                    
                    <div className="hidden sm:flex bg-black/40 border border-gray-700 rounded-xl p-1 gap-1">
                       <button 
                         onClick={() => setViewMode('grid')}
                         className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'text-brand-orange bg-brand-orange/10' : 'text-gray-600 hover:text-gray-400'}`}
                       >
                         <FaThLarge size={14}/>
                       </button>
                       <button 
                         onClick={() => setViewMode('list')}
                         className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'text-brand-orange bg-brand-orange/10' : 'text-gray-600 hover:text-gray-400'}`}
                       >
                         <FaThList size={14}/>
                       </button>
                    </div>
                  </div>
               </div>

               <CarGrid 
                  cars={cars}
                  visibleCars={cars} 
                  loading={loading}
                  viewMode={viewMode}
                  openModal={handleOpenModal}
                  handleWhatsApp={handleWhatsApp}
                  observerRef={hasMore ? observerTarget : null} 
                  resetFilters={resetApp}
                  formatCurrency={formatCurrency}
                />
            </div>
         </div>
      </div>

      <CarModal car={selectedCar} onClose={handleCloseModal} handleWhatsApp={handleWhatsApp} formatCurrency={formatCurrency} />
      <Footer handleWhatsApp={() => handleWhatsApp()} onQuickFilter={handleQuickFilter} />
      <ChatWidget isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} cars={specialOffersCars.length > 0 ? specialOffersCars : cars.slice(0, 10)} openModal={handleOpenModal} formatCurrency={formatCurrency} />
    </div>
  );
}
