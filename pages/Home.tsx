
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom'; // Importado para gerenciar URL
import { Car, FilterOptions, Seller } from '../types';
import { fetchCars, fetchSellers, fetchAvailableBrands, fetchAvailableYears } from '../supabaseClient';

// Importing Components
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { SpecialOffers } from '../components/SpecialOffers';
import { FilterBar } from '../components/FilterBar';
import { CarGrid } from '../components/CarGrid';
import { CarModal } from '../components/CarModal';
import { ChatWidget } from '../components/ChatWidget';
import { Footer } from '../components/Footer';

export const Home = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialOffersCars, setSpecialOffersCars] = useState<Car[]>([]);
  const [displayLimit, setDisplayLimit] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilters, setTempFilters] = useState({ make: '', maxPrice: '', year: '', vehicleType: '' });
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // URL Params Management
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Vendedores State
  const [sellers, setSellers] = useState<Seller[]>([]);

  const loadInventory = async (options: FilterOptions = {}) => {
    setLoading(true);
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => setLoading(false), 5000);
    
    const { data } = await fetchCars(options);
    clearTimeout(timeout);
    
    setCars(data || []);
    setLoading(false);
    setDisplayLimit(12);
  };

  const loadFiltersData = async (vehicleType?: string) => {
    const brands = await fetchAvailableBrands(vehicleType);
    const years = await fetchAvailableYears(vehicleType);
    setAvailableMakes(brands);
    setAvailableYears(years);
  };

  useEffect(() => {
    const initData = async () => {
       const carsRes = await fetchCars({});
       if (carsRes.data) setSpecialOffersCars(carsRes.data);
       
       const sellersRes = await fetchSellers();
       if (sellersRes.data) setSellers(sellersRes.data);

       await loadFiltersData();
    };
    initData();
  }, []);

  useEffect(() => {
    loadInventory();
  }, []);

  // --- DEEP LINKING LOGIC ---
  // Verifica se existe um ID na URL assim que os carros terminam de carregar
  useEffect(() => {
    const carIdFromUrl = searchParams.get('carId');
    if (!loading && cars.length > 0 && carIdFromUrl && !selectedCar) {
      const foundCar = cars.find(c => c.id === carIdFromUrl);
      if (foundCar) {
        setSelectedCar(foundCar);
      }
    }
  }, [loading, cars, searchParams]);

  // Recarregar marcas e anos quando o tipo de veículo muda no filtro visual
  useEffect(() => {
    loadFiltersData(tempFilters.vehicleType);
    // Limpar seleções que podem não existir no novo tipo
    setTempFilters(prev => ({ ...prev, make: '' }));
  }, [tempFilters.vehicleType]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setDisplayLimit(prev => prev + 12); },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [cars, loading]); 

  const applyFilters = () => {
    loadInventory({ ...tempFilters, search: searchTerm });
  };

  const clearFilters = () => {
    setTempFilters({ make: '', maxPrice: '', year: '', vehicleType: '' });
    loadInventory({ search: searchTerm });
  };

  const handleSearch = () => {
    loadInventory({ ...tempFilters, search: searchTerm });
  };

  const resetApp = () => {
    setTempFilters({make:'', maxPrice:'', year:'', vehicleType: ''});
    setSearchTerm('');
    setSearchParams({}); // Limpa URL
    loadInventory();
    window.scrollTo(0,0);
  }

  // --- MODAL HANDLERS ---
  const handleOpenModal = (car: Car) => {
    setSelectedCar(car);
    // Atualiza a URL sem recarregar a página
    setSearchParams(prev => {
      prev.set('carId', car.id);
      return prev;
    });
  };

  const handleCloseModal = () => {
    setSelectedCar(null);
    // Remove o ID da URL
    setSearchParams(prev => {
      prev.delete('carId');
      return prev;
    });
  };

  // Lógica de sorteio de vendedor
  const getRandomSeller = () => {
    if (sellers.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * sellers.length);
    return sellers[randomIndex];
  };

  const handleWhatsApp = (car?: Car) => {
    const seller = getRandomSeller();
    const phone = seller ? seller.whatsapp.replace(/\D/g, '') : "5511999999999"; // Fallback
    const sellerName = seller ? seller.name.split(' ')[0] : "Consultor";

    let text = `Olá ${sellerName}! Gostaria de saber mais sobre as ofertas do Arena Repasse.`;
    
    if (car) {
      text = `Olá ${sellerName}! Estou interessado no carro: *${car.make} ${car.model} ${car.year}* (ID: ${car.id}). Gostaria de mais informações.`;
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const visibleCars = cars.slice(0, displayLimit);
  const hasActiveFilters = Boolean(tempFilters.make || tempFilters.maxPrice || tempFilters.year || tempFilters.vehicleType);

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
      {specialOffersCars.length > 0 && (
        <SpecialOffers 
          cars={specialOffersCars} 
          openModal={handleOpenModal} 
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
        availableYears={availableYears}
        hasActiveFilters={hasActiveFilters}
      />
      <CarGrid 
        cars={cars}
        visibleCars={visibleCars}
        loading={loading}
        openModal={handleOpenModal}
        handleWhatsApp={handleWhatsApp}
        observerRef={observerTarget}
        resetFilters={resetApp}
        formatCurrency={formatCurrency}
      />
      <CarModal 
        car={selectedCar}
        onClose={handleCloseModal}
        handleWhatsApp={handleWhatsApp}
        formatCurrency={formatCurrency}
      />
      <Footer handleWhatsApp={() => handleWhatsApp()} />
      <ChatWidget 
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        cars={specialOffersCars.length > 0 ? specialOffersCars : cars} 
        openModal={handleOpenModal}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
