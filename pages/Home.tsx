
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; // Importado para gerenciar URL
import { Car, FilterOptions, Seller } from '../types';
import { fetchCars, fetchSellers, fetchAvailableBrands, fetchAvailableYears, fetchSpecialOffers } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext'; // Novo contexto
import { encodeCarUrl, decodeCarIdFromUrl } from '../utils/urlHelpers'; // Importando Helper

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
  const { settings } = useCompany(); // Dados da empresa
  
  // State principal de carros (acumulativo)
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
  const [tempFilters, setTempFilters] = useState({ make: '', maxPrice: '', year: '', vehicleType: '' });
  
  // Dados para os filtros (Selects)
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // URL Params Management
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Vendedores State
  const [sellers, setSellers] = useState<Seller[]>([]);

  // Carregar dados auxiliares (Ofertas, Vendedores, Filtros)
  useEffect(() => {
    const initData = async () => {
       // Busca independente para ofertas especiais (não depende da paginação da grid)
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

  // Função principal de busca com Paginação
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
       status: 'available' // Força apenas disponíveis na home
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
      // Filtra duplicatas apenas por segurança, caso a request duplique algo no edge case
      setCars(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const filteredNew = newCars.filter(c => !existingIds.has(c.id));
        return [...prev, ...filteredNew];
      });
    }

    // Se vieram menos carros que o limite, acabou a lista
    if (newCars.length < ITEMS_PER_PAGE) {
      setHasMore(false);
    } else {
      // Se vieram 12, pode ser que tenha mais ou não. Assumimos que sim.
      // Poderiamos usar 'count' se o Supabase retornasse, mas a lógica de length é eficiente.
      setHasMore(true);
    }

    setLoading(false);
    setIsLoadingMore(false);
    
    if (!isReset) {
      setPage(prev => prev + 1);
    } else {
      setPage(1); // Prepara para a próxima
    }
  }, [tempFilters, searchTerm, page]);

  // Carregamento inicial (apenas uma vez ou quando filtros mudam drasticamente)
  useEffect(() => {
    loadInventory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempFilters, searchTerm]); // Recarrega do zero se filtro mudar

  // Infinite Scroll Observer
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


  // --- DEEP LINKING LOGIC (Single Source of Truth) ---
  // Este useEffect controla ABERTURA e FECHAMENTO do modal baseado na URL
  useEffect(() => {
    const carIdLegacy = searchParams.get('carId');
    const prettyUrl = searchParams.get('v');

    let targetId = carIdLegacy;

    // Se tiver a URL amigável e não tiver o ID legado, tenta decodificar
    if (prettyUrl && !targetId) {
      targetId = decodeCarIdFromUrl(prettyUrl);
    }

    if (!loading) {
      if (targetId) {
        // Se tem ID na URL, mas o carro selecionado é diferente ou nulo, abre o modal
        if (selectedCar?.id !== targetId) {
          const foundCar = cars.find(c => c.id === targetId) || specialOffersCars.find(c => c.id === targetId);
          if (foundCar) {
            setSelectedCar(foundCar);
          }
        }
      } else {
        // Se NÃO tem ID na URL, mas o modal está aberto, fecha o modal
        if (selectedCar) {
          setSelectedCar(null);
        }
      }
    }
  }, [loading, cars, specialOffersCars, searchParams, selectedCar]);

  // Recarregar marcas e anos quando o tipo de veículo muda
  useEffect(() => {
    loadFiltersData(tempFilters.vehicleType);
    setTempFilters(prev => ({ ...prev, make: '' })); // Reseta marca ao trocar tipo
  }, [tempFilters.vehicleType]);


  const applyFilters = () => {
    loadInventory(true);
  };

  const clearFilters = () => {
    setTempFilters({ make: '', maxPrice: '', year: '', vehicleType: '' });
    setSearchTerm(''); // Limpa busca também
    // O useEffect [tempFilters] vai disparar o reload
  };

  const handleSearch = () => {
    loadInventory(true);
  };

  const resetApp = () => {
    setTempFilters({make:'', maxPrice:'', year:'', vehicleType: ''});
    setSearchTerm('');
    setSearchParams({}); // Limpa URL
    window.scrollTo(0,0);
    // useEffect disparará loadInventory(true)
  }

  // --- FILTRO RÁPIDO DO FOOTER ---
  const handleQuickFilter = (type: string) => {
    // Reseta filtros específicos para garantir resultados da categoria
    setTempFilters({
      make: '',
      year: '',
      maxPrice: '',
      vehicleType: type
    });
    // O useEffect [tempFilters] vai disparar a busca automaticamente
  };

  // --- MODAL HANDLERS ---
  const handleOpenModal = (car: Car) => {
    // NÃO setamos setSelectedCar aqui. Apenas atualizamos a URL.
    // O useEffect de Deep Linking detectará a mudança na URL e abrirá o modal.
    setSearchParams(prev => {
      // Gera URL amigável
      const prettyParam = encodeCarUrl(car.id, car.make, car.model, car.year);
      prev.set('v', prettyParam);
      prev.delete('carId'); // Garante que o legado não fique
      return prev;
    });
  };

  const handleCloseModal = () => {
    // NÃO setamos setSelectedCar(null) aqui. Apenas limpamos a URL.
    // O useEffect detectará que não tem mais ID e fechará o modal.
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
    // Lógica inteligente: Tenta pegar um vendedor aleatório. 
    // Se não tiver vendedores cadastrados, usa o telefone geral da empresa (configurações)
    const seller = getRandomSeller();
    
    // Fallback: Telefone das configurações ou o padrão hardcoded se ainda não carregou
    const companyPhone = settings?.phone_whatsapp || "5511999999999";
    
    const phone = seller ? seller.whatsapp.replace(/\D/g, '') : companyPhone.replace(/\D/g, ''); 
    const sellerName = seller ? seller.name.split(' ')[0] : "Consultor";

    let text = `Olá ${sellerName}! Gostaria de saber mais sobre as ofertas do Arena Repasse.`;
    
    if (car) {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      // Garante o formato correto do link usando URL Amigável
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

  const hasActiveFilters = Boolean(tempFilters.make || tempFilters.maxPrice || tempFilters.year || tempFilters.vehicleType || searchTerm);

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
        visibleCars={cars} // Passamos todos os carregados (a paginação é server-side)
        loading={loading}
        openModal={handleOpenModal}
        handleWhatsApp={handleWhatsApp}
        observerRef={hasMore ? observerTarget : null} // Só observa se tiver mais
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
        // Passamos as ofertas especiais para o Chat ter contexto de carros bons, 
        // ou concatenamos com os atuais (limitado para não estourar tokens do LLM)
        cars={specialOffersCars.length > 0 ? specialOffersCars : cars.slice(0, 10)} 
        openModal={handleOpenModal}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
