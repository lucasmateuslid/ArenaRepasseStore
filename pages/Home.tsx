
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { Car, FilterOptions, Seller } from '../types';
import { fetchCars, fetchSellers, fetchAvailableBrands, fetchAvailableYears, fetchSpecialOffers } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext'; 
import { encodeCarUrl, decodeCarIdFromUrl } from '../utils/urlHelpers'; 

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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [specialOffersCars, setSpecialOffersCars] = useState<Car[]>([]);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilters, setTempFilters] = useState({ 
    make: '', 
    minPrice: '0', 
    maxPrice: '500000', 
    year: '', 
    vehicleType: '' 
  });
  
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sellers, setSellers] = useState<Seller[]>([]);

  useEffect(() => {
    const initData = async () => {
       const offersData = await fetchSpecialOffers();
       setSpecialOffersCars(offersData);
       
       const sellersRes = await fetchSellers();
       if (sellersRes.data) setSellers(sellersRes.data);

       await loadFiltersData();
    };
    initData();
  }, []);

  const loadFiltersData = async (vehicleType?: string) => {
    const brands = await fetchAvailableBrands(vehicleType);
    const years = await fetchAvailableYears(vehicleType);
    setAvailableMakes(brands);
    setAvailableYears(years);
  };

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

    const { data, error } = await fetchCars(filters, currentPage, ITEMS_PER_PAGE);
    
    if (error) {
      console.error("Erro ao buscar carros:", error);
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    const newCars = data || [];
    
    if (isReset) {
      setCars(newCars);
    } else {
      setCars(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const filteredNew = newCars.filter(c => !existingIds.has(c.id));
        return [...prev, ...filteredNew];
      });
    }

    if (newCars.length < ITEMS_PER_PAGE) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }

    setLoading(false);
    setIsLoadingMore(false);
    
    if (!isReset) {
      setPage(prev => prev + 1);
    } else {
      setPage(1); 
    }
  }, [tempFilters, searchTerm, page]);

  useEffect(() => {
    loadInventory(true);
  }, [tempFilters, searchTerm]); 

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
    
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, isLoadingMore, loading, loadInventory]);


  useEffect(() => {
    const carIdLegacy = searchParams.get('carId');
    const prettyUrl = searchParams.get('v');

    let targetId = carIdLegacy;

    if (prettyUrl && !targetId) {
      targetId = decodeCarIdFromUrl(prettyUrl);
    }

    if (!loading) {
      if (targetId) {
        if (selectedCar?.id !== targetId) {
          const foundCar = cars.find(c => c.id === targetId) || specialOffersCars.find(c => c.id === targetId);
          if (foundCar) {
            setSelectedCar(foundCar);
          }
        }
      } else {
        if (selectedCar) {
          setSelectedCar(null);
        }
      }
    }
  }, [loading, cars, specialOffersCars, searchParams, selectedCar]);

  useEffect(() => {
    loadFiltersData(tempFilters.vehicleType);
    setTempFilters(prev => ({ ...prev, make: '' })); 
  }, [tempFilters.vehicleType]);


  const applyFilters = () => {
    loadInventory(true);
  };

  const clearFilters = () => {
    setTempFilters({ 
      make: '', 
      minPrice: '0', 
      maxPrice: '500000', 
      year: '', 
      vehicleType: '' 
    });
    setSearchTerm(''); 
  };

  const handleSearch = () => {
    loadInventory(true);
  };

  const resetApp = () => {
    setTempFilters({
      make:'', 
      minPrice: '0', 
      maxPrice: '500000', 
      year:'', 
      vehicleType: ''
    });
    setSearchTerm('');
    setSearchParams({}); 
    window.scrollTo(0,0);
  }

  const handleQuickFilter = (type: string) => {
    setTempFilters({
      make: '',
      year: '',
      minPrice: '0',
      maxPrice: '500000',
      vehicleType: type
    });
  };

  const handleOpenModal = (car: Car) => {
    setSearchParams(prev => {
      const prettyParam = encodeCarUrl(car.id, car.make, car.model, car.year);
      prev.set('v', prettyParam);
      prev.delete('carId'); 
      return prev;
    });
  };

  const handleCloseModal = () => {
    setSearchParams(prev => {
      prev.delete('carId');
      prev.delete('v');
      return prev;
    });
  };

  const getRandomSeller = () => {
    if (sellers.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * sellers.length);
    return sellers[randomIndex];
  };

  const handleWhatsApp = (car?: Car) => {
    const seller = getRandomSeller();
    const companyPhone = settings?.phone_whatsapp || "5511999999999";
    const phone = seller ? seller.whatsapp.replace(/\D/g, '') : companyPhone.replace(/\D/g, ''); 
    const sellerName = seller ? seller.name.split(' ')[0] : "Consultor";

    let text = `Olá ${sellerName}! Gostaria de saber mais sobre as ofertas do Arena Repasse.`;
    
    if (car) {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const prettyParam = encodeCarUrl(car.id, car.make, car.model, car.year);
      const carLink = `${origin}${pathname}#/?v=${prettyParam}`;
      
      text = `Olá ${sellerName}! Estou interessado neste veículo:\n\n*${car.make} ${car.model} ${car.year}*\n\nVeja os detalhes aqui: ${carLink}`;
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const hasActiveFilters = Boolean(
    tempFilters.make || 
    tempFilters.year || 
    tempFilters.vehicleType || 
    searchTerm || 
    tempFilters.minPrice !== '0' || 
    tempFilters.maxPrice !== '500000'
  );

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
        visibleCars={cars} 
        loading={loading}
        openModal={handleOpenModal}
        handleWhatsApp={handleWhatsApp}
        observerRef={hasMore ? observerTarget : null} 
        resetFilters={resetApp}
        formatCurrency={formatCurrency}
      />
      <CarModal 
        car={selectedCar}
        onClose={handleCloseModal}
        handleWhatsApp={handleWhatsApp}
        formatCurrency={formatCurrency}
      />
      <Footer 
        handleWhatsApp={() => handleWhatsApp()} 
        onQuickFilter={handleQuickFilter}
      />
      <ChatWidget 
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        cars={specialOffersCars.length > 0 ? specialOffersCars : cars.slice(0, 10)} 
        openModal={handleOpenModal}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
