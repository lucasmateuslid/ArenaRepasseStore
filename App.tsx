
import React, { useState, useEffect, useRef } from 'react';
import { Car, FilterOptions } from './types';
import { fetchCars } from './supabaseClient'; // uploadMockData removido do import padrão

// Importing Components
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SpecialOffers } from './components/SpecialOffers';
import { FilterBar } from './components/FilterBar';
import { CarGrid } from './components/CarGrid';
import { CarModal } from './components/CarModal';
import { ChatWidget } from './components/ChatWidget';
import { Footer } from './components/Footer';

function App() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  // Estado dedicado para ofertas especiais (Persistente independente de filtros)
  const [specialOffersCars, setSpecialOffersCars] = useState<Car[]>([]);
  
  // Otimização de Renderização (Infinite Scroll)
  const [displayLimit, setDisplayLimit] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null); 

  // Estado de Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros Temporários (UI - Inputs)
  const [tempFilters, setTempFilters] = useState({
    make: '',
    maxPrice: '',
    year: ''
  });

  // Load Inventory (Grid Principal - Afetado por filtros)
  const loadInventory = async (options: FilterOptions = {}) => {
    setLoading(true);
    // Busca exclusivamente do Supabase
    const { data, error: fetchError } = await fetchCars(options);
    
    if (fetchError) {
      setError(fetchError);
      setCars([]);
    } else {
      setError(null);
      setCars(data || []);
    }
    setLoading(false);
    setDisplayLimit(12); // Reset scroll on new data
  };

  // Carrega as Ofertas Especiais separadamente (Apenas uma vez, sem filtros)
  useEffect(() => {
    const loadSpecialOffers = async () => {
      // Busca sem filtros para obter o estoque base completo para os destaques
      const { data } = await fetchCars({});
      if (data && data.length > 0) {
        setSpecialOffersCars(data);
      }
    };
    loadSpecialOffers();
  }, []);

  // Initial Load do Grid Principal
  useEffect(() => {
    loadInventory();
  }, []);

  // Infinite Scroll Observer logic in Parent to manage data slice
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setDisplayLimit(prev => prev + 12);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [cars, loading]); 

  // Handlers
  const applyFilters = () => {
    loadInventory({
      ...tempFilters,
      search: searchTerm
    });
  };

  const clearFilters = () => {
    setTempFilters({
      make: '',
      maxPrice: '',
      year: ''
    });
    loadInventory({
      search: searchTerm
    });
  };

  const handleSearch = () => {
    loadInventory({
      ...tempFilters,
      search: searchTerm
    });
  };

  const resetApp = () => {
    setTempFilters({make:'', maxPrice:'', year:''});
    setSearchTerm('');
    loadInventory();
    window.scrollTo(0,0);
  }

  // Helper to open WhatsApp (Centralized Logic)
  const handleWhatsApp = (car?: Car) => {
    const phone = "5511999999999";
    let text = "Olá! Gostaria de saber mais sobre as ofertas do Arena Repasse.";
    
    if (car) {
      text = `Olá! Vi o *${car.make} ${car.model} ${car.year}* por *${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price)}* no site e tenho interesse.`;
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Sliced data for rendering
  const visibleCars = cars.slice(0, displayLimit);
  
  const availableMakes = [
    'Chevrolet', 'Fiat', 'Volkswagen', 'Renault', 'Toyota', 'Jeep', 'Hyundai', 'Honda', 'Ford'
  ];

  const hasActiveFilters = Boolean(tempFilters.make || tempFilters.maxPrice || tempFilters.year);

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      
      <Header 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        resetApp={resetApp}
        handleWhatsApp={handleWhatsApp}
      />

      <Hero />

      {/* Seção "Sonhos Imperdíveis" */}
      {specialOffersCars.length > 0 && (
        <SpecialOffers 
          cars={specialOffersCars} 
          openModal={setSelectedCar} 
          handleWhatsApp={handleWhatsApp} 
          formatCurrency={formatCurrency} 
        />
      )}

      <FilterBar 
        tempFilters={tempFilters}
        setTempFilters={setTempFilters}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        availableMakes={availableMakes}
        hasActiveFilters={hasActiveFilters}
      />

      <CarGrid 
        cars={cars}
        visibleCars={visibleCars}
        loading={loading}
        openModal={setSelectedCar}
        handleWhatsApp={handleWhatsApp}
        observerRef={observerTarget}
        resetFilters={resetApp}
        formatCurrency={formatCurrency}
      />

      <CarModal 
        car={selectedCar}
        onClose={() => setSelectedCar(null)}
        handleWhatsApp={handleWhatsApp}
        formatCurrency={formatCurrency}
      />

      <Footer handleWhatsApp={() => handleWhatsApp()} />

      <ChatWidget 
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        cars={specialOffersCars.length > 0 ? specialOffersCars : cars} // Contexto de IA usa a lista completa
        openModal={setSelectedCar}
        formatCurrency={formatCurrency}
      />

    </div>
  );
}

export default App;
