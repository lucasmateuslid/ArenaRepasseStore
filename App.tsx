
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Car, CartItem, Message } from './types';
import { fetchCars, uploadMockData } from './supabaseClient'; // NOTE: This file now contains Firebase Logic

function App() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // New Error State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null); // State for Modal
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // For Gallery
  const [filters, setFilters] = useState({
    make: '',
    maxPrice: '',
    year: ''
  });

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o consultor virtual da Arena Repasse 🚗. Me diga o que procura (ex: "Carro popular até 50 mil") e eu busco as melhores oportunidades abaixo da FIPE para você!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Initial Load
  const loadInventory = async () => {
    // Only set loading on first load or if we are in an error state to avoid flickering
    if (cars.length === 0) setLoading(true);
    
    const { data, error: fetchError } = await fetchCars();
    
    if (fetchError) {
      setError(fetchError);
      setLoading(false);
    } else {
      setError(null);
      setCars(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();

    // Auto-reload when user comes back to the tab (helpful after fixing Firebase rules)
    const handleFocus = () => {
      loadInventory();
    };
    window.addEventListener('focus', handleFocus);

    const savedCart = localStorage.getItem('arena_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('arena_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  // Filters logic
  const filteredCars = cars.filter(c => {
    if (filters.make && c.make !== filters.make) return false;
    if (filters.maxPrice && c.price > Number(filters.maxPrice)) return false;
    if (filters.year && c.year < Number(filters.year)) return false;
    return true;
  });

  const addToCart = (car: Car) => {
    if (!cart.find(item => item.id === car.id)) {
      setCart([...cart, { ...car, addedAt: Date.now() }]);
      setIsCartOpen(true);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const openModal = (car: Car) => {
    setSelectedCar(car);
    setSelectedImageIndex(0);
    // document.body.style.overflow = 'hidden'; // Prevent scrolling background
  };

  const closeModal = () => {
    setSelectedCar(null);
    // document.body.style.overflow = 'auto';
  };

  // Function to seed database (Admin feature)
  const handleSeedDatabase = async () => {
    const confirm = window.confirm("Deseja popular o banco de dados Firebase com os carros de exemplo?");
    if (confirm) {
      setLoading(true);
      const success = await uploadMockData();
      if (success) {
        alert("Sucesso! Recarregando estoque...");
        await loadInventory();
      } else {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const inventoryContext = cars.map(c => ({
        id: c.id,
        carro: `${c.make} ${c.model}`,
        ano: c.year,
        preco_venda: c.price,
        tabela_fipe: c.fipePrice,
        margem_lucro: c.fipePrice - c.price,
        tipo: c.description
      }));

      const chatSession: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          temperature: 0.7, 
          systemInstruction: `
            Você é o "Arena Bot", consultor da Arena Repasse.
            FOCO: Carros populares e lucro real.
            ESTOQUE ATUAL DO SITE: ${JSON.stringify(inventoryContext)}
            
            REGRAS:
            1. Se a lista de ESTOQUE estiver vazia, diga que o estoque está sendo atualizado.
            2. Entenda valores: "tenho 40k" -> mostre carros até 40k.
            3. Enfatize: "R$ X (R$ Y abaixo da FIPE!)".
            4. Dúvidas complexas -> WhatsApp: https://wa.me/5511999999999
          `
        }
      });
      
      const result: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg });
      let responseText = result.text || 'Desculpe, não entendi.';
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Minha conexão falhou. Chame no WhatsApp.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      
      {/* HEADER */}
      <header className="bg-brand-darkRed/95 backdrop-blur-md sticky top-0 z-40 border-b border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => {setFilters({make:'', maxPrice:'', year:''}); window.scrollTo(0,0)}}>
            <div className="text-2xl md:text-3xl font-black italic tracking-tighter text-white">
              ARENA<span className="text-brand-orange group-hover:text-white transition-colors duration-300">REPASSE</span>
            </div>
          </div>
          <button className="md:hidden relative p-2" onClick={() => setIsCartOpen(true)}>
            <i className="fa-solid fa-cart-shopping text-xl text-gray-300"></i>
            {cart.length > 0 && <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">{cart.length}</span>}
          </button>
          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative group">
             <input type="text" placeholder="Busque por marca, modelo..." className="w-full h-10 pl-4 pr-10 rounded-lg bg-brand-surface border border-gray-700 text-sm focus:outline-none focus:border-brand-orange transition-all placeholder-gray-500"/>
             <button className="absolute right-0 top-0 h-10 w-10 text-gray-400 group-focus-within:text-brand-orange"><i className="fa-solid fa-magnifying-glass"></i></button>
          </div>
          <div className="hidden md:flex items-center gap-6 text-gray-300">
            <button className="flex items-center gap-2 hover:text-white transition-colors"><i className="fa-solid fa-user"></i> <span className="text-sm font-medium">Entrar</span></button>
            <button className="flex items-center gap-2 relative hover:text-brand-orange transition-colors" onClick={() => setIsCartOpen(true)}>
              <i className="fa-solid fa-cart-shopping"></i> <span className="text-sm font-medium">Carrinho</span>
              {cart.length > 0 && <span className="bg-brand-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-[#1a0505]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-dark z-10"></div>
        <div className="container mx-auto px-4 py-8 md:py-16 relative z-20 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2 space-y-4 animate-slide-up">
            <div className="inline-block bg-brand-orange text-white px-4 py-1 text-sm font-black uppercase rounded shadow-glow transform -skew-x-12">
              <span className="block transform skew-x-12">Oportunidade de Lucro</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-none italic text-white tracking-tight">
              REPASSE <br/>
              <span className="text-brand-orange">BRASIL</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-md font-light">
              Carros populares abaixo da FIPE. A fonte secreta dos lojistas agora aberta para você.
            </p>
          </div>
          <div className="w-full md:w-1/2 flex justify-center relative">
            <div className="absolute inset-0 bg-brand-orange/20 blur-[80px] rounded-full"></div>
            {/* Updated Hero Image: Generic white hatchback popular in Brazil */}
            <img 
              src="https://pngimg.com/d/chevrolet_PNG170.png" 
              alt="Carro Popular" 
              className="w-full max-w-lg drop-shadow-2xl relative z-10 animate-fade-in transform hover:scale-105 transition duration-700"
            />
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="sticky top-16 md:top-20 z-30 bg-brand-darkRed/95 backdrop-blur border-b border-gray-800 py-4 shadow-lg">
        <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex flex-row md:grid md:grid-cols-4 gap-3 min-w-[300px]">
             {/* Filter inputs same as before but ensured functionality */}
            <select className="flex-1 bg-brand-surface border border-gray-700 text-white p-3 rounded-lg focus:border-brand-orange outline-none transition-colors text-sm font-medium min-w-[140px]" value={filters.make} onChange={(e) => setFilters({...filters, make: e.target.value})}>
              <option value="">Marca</option>
              {Array.from(new Set(cars.map(c => c.make))).map(make => <option key={make} value={make}>{make}</option>)}
            </select>
            <select className="flex-1 bg-brand-surface border border-gray-700 text-white p-3 rounded-lg focus:border-brand-orange outline-none transition-colors text-sm font-medium min-w-[120px]" value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})}>
              <option value="">Ano Min.</option>
              <option value="2018">2018+</option>
              <option value="2020">2020+</option>
              <option value="2022">2022+</option>
            </select>
            <select className="flex-1 bg-brand-surface border border-gray-700 text-white p-3 rounded-lg focus:border-brand-orange outline-none transition-colors text-sm font-medium min-w-[140px]" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}>
              <option value="">Preço Máx</option>
              <option value="40000">R$ 40k</option>
              <option value="60000">R$ 60k</option>
              <option value="80000">R$ 80k</option>
            </select>
            <button className="flex-1 bg-brand-orange hover:bg-brand-orangeHover text-white font-bold rounded-lg p-3 shadow-glow flex items-center justify-center gap-2 min-w-[120px]">
              <i className="fa-solid fa-filter"></i> <span className="hidden md:inline">FILTRAR</span>
            </button>
          </div>
        </div>
      </section>

      {/* GRID INVENTORY */}
      <main id="inventory" className="container mx-auto px-4 py-12 flex-grow">
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {[1,2,3,4].map(i => <div key={i} className="bg-brand-surface rounded-lg h-96 animate-pulse"></div>)}
           </div>
        ) : error === 'database-not-found' ? (
          <div className="bg-brand-surface border border-red-900 rounded-xl p-8 text-center max-w-2xl mx-auto">
             <i className="fa-solid fa-database text-6xl text-brand-red mb-4"></i>
             <h2 className="text-2xl font-bold text-white mb-2">Banco de Dados Não Encontrado</h2>
             <p className="text-gray-400 mb-6">O projeto Firebase existe, mas o banco Firestore ainda não foi criado no console.</p>
             <a href="https://console.firebase.google.com/project/storearena-aa9f4/firestore" target="_blank" rel="noopener noreferrer" className="inline-block bg-brand-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition">
               <i className="fa-solid fa-external-link-alt mr-2"></i> Criar Banco de Dados Agora
             </a>
             <p className="text-xs text-gray-500 mt-4">Crie no modo "Test" ou "Production" na região de sua preferência.</p>
          </div>
        ) : error === 'permission-denied' ? (
           <div className="bg-brand-surface border border-red-900 rounded-xl p-8 text-left max-w-3xl mx-auto shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <i className="fa-solid fa-lock text-4xl text-brand-red"></i>
                <div>
                   <h2 className="text-2xl font-bold text-white">Acesso Bloqueado (Permissões)</h2>
                   <p className="text-gray-400">O Firebase bloqueou a leitura dos dados. Você precisa atualizar as regras de segurança.</p>
                </div>
              </div>
              
              <div className="bg-black/50 p-4 rounded-lg border border-gray-700 mb-6">
                 <p className="text-sm text-gray-400 mb-2 font-mono">1. Acesse: <a href="https://console.firebase.google.com/project/storearena-aa9f4/firestore/rules" target="_blank" className="text-brand-orange hover:underline font-bold">Firestore Database {'>'} Rules</a></p>
                 <p className="text-sm text-gray-400 mb-2 font-mono">2. Cole este código (Permite tudo - Apenas para Testes):</p>
                 <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto border border-gray-700">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                 </pre>
              </div>
              <button onClick={() => window.location.reload()} className="w-full bg-brand-red hover:bg-red-800 text-white font-bold py-3 rounded-lg transition">
                 <i className="fa-solid fa-rotate-right mr-2"></i> Já atualizei, tentar novamente
              </button>
           </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <i className="fa-solid fa-car-tunnel text-6xl mb-4 text-gray-700"></i>
            <p className="text-xl mb-4">Nenhum veículo encontrado no banco de dados.</p>
            {/* Show seed button if inventory is empty (Admin Helper) */}
            <button 
              onClick={handleSeedDatabase}
              className="mt-4 px-6 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm hover:bg-gray-700 transition"
            >
              <i className="fa-solid fa-database mr-2"></i> Carregar Estoque Inicial (Admin)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCars.map(car => (
              <div 
                key={car.id} 
                onClick={() => openModal(car)}
                className="bg-brand-surface border border-gray-700 rounded-2xl overflow-hidden group hover:border-brand-orange transition-all duration-300 flex flex-col hover:-translate-y-2 shadow-card cursor-pointer"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                  <img src={car.image} alt={car.model} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" loading="lazy" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }} />
                  
                  {/* FIPE BADGE - HUGE DISCOUNT */}
                  {(car.fipePrice - car.price) > 0 && (
                    <div className="absolute top-0 right-0 bg-brand-orange text-white px-3 py-2 rounded-bl-xl font-black text-lg shadow-lg z-10 flex flex-col items-center leading-none">
                      <span className="text-[10px] uppercase font-medium mb-0.5">Abaixo FIPE</span>
                      <span>-{Math.round(((car.fipePrice - car.price) / car.fipePrice) * 100)}%</span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-brand-surface to-transparent h-20"></div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col relative">
                  {/* Make/Year Pill */}
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{car.make}</span>
                     <span className="bg-gray-800 text-gray-300 text-xs font-bold px-2 py-1 rounded border border-gray-600">{car.year}</span>
                  </div>

                  {/* HUGE MODEL NAME */}
                  <h3 className="text-2xl font-black text-white leading-tight mb-4 group-hover:text-brand-orange transition-colors">
                    {car.model}
                  </h3>
                  
                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-6 bg-brand-dark/30 p-3 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2"><i className="fa-solid fa-gauge text-brand-orange"></i> {car.mileage/1000}k km</div>
                    <div className="flex items-center gap-2"><i className="fa-solid fa-gas-pump text-brand-orange"></i> {car.fuel}</div>
                    <div className="flex items-center gap-2"><i className="fa-solid fa-gears text-brand-orange"></i> {car.transmission}</div>
                    <div className="flex items-center gap-2"><i className="fa-solid fa-location-dot text-brand-orange"></i> {car.location.split(',')[0]}</div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-800/50">
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-xs text-gray-500 line-through">FIPE {formatCurrency(car.fipePrice)}</span>
                       <span className="text-green-500 text-xs font-bold">Economize {formatCurrency(car.fipePrice - car.price)}</span>
                    </div>
                    
                    {/* HUGE PRICE */}
                    <div className="flex justify-between items-center">
                      <span className="text-3xl font-black text-white tracking-tight">{formatCurrency(car.price)}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(car); }}
                        className="h-12 w-12 bg-brand-darkRed border border-brand-orange text-brand-orange rounded-full flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all shadow-lg active:scale-90"
                      >
                        <i className="fa-solid fa-cart-plus text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CAR DETAILS MODAL */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-brand-surface w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up">
            
            {/* Close Button Mobile */}
            <button onClick={closeModal} className="absolute top-4 right-4 z-20 md:hidden bg-black/50 text-white p-2 rounded-full">
              <i className="fa-solid fa-times text-xl"></i>
            </button>

            {/* Gallery Section (Left/Top) */}
            <div className="w-full md:w-3/5 bg-black flex flex-col relative group">
              <div className="flex-1 relative h-[40vh] md:h-full">
                 <img 
                    src={(selectedCar.gallery && selectedCar.gallery[selectedImageIndex]) || selectedCar.image} 
                    className="w-full h-full object-contain md:object-cover" 
                    alt="Detail" 
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }}
                 />
                 {/* Navigation Arrows */}
                 {selectedCar.gallery && (
                   <>
                     <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-brand-orange transition" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(prev => prev === 0 ? (selectedCar.gallery?.length || 1) - 1 : prev - 1);
                        }}>
                        <i className="fa-solid fa-chevron-left"></i>
                     </button>
                     <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-brand-orange transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(prev => prev === (selectedCar.gallery?.length || 1) - 1 ? 0 : prev + 1);
                        }}>
                        <i className="fa-solid fa-chevron-right"></i>
                     </button>
                   </>
                 )}
              </div>
              {/* Thumbnails */}
              <div className="h-20 bg-brand-darkRed/50 flex items-center gap-2 p-2 overflow-x-auto no-scrollbar">
                {(selectedCar.gallery || [selectedCar.image]).map((img, idx) => (
                  <img 
                    key={idx}
                    src={img}
                    className={`h-16 w-24 object-cover rounded cursor-pointer border-2 transition ${selectedImageIndex === idx ? 'border-brand-orange opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    onClick={() => setSelectedImageIndex(idx)}
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }}
                  />
                ))}
              </div>
            </div>

            {/* Info Section (Right/Bottom) */}
            <div className="w-full md:w-2/5 p-6 md:p-8 overflow-y-auto bg-brand-surface flex flex-col">
              <div className="flex justify-between items-start mb-4">
                 <div>
                   <span className="text-brand-orange font-bold text-sm tracking-wider uppercase mb-1 block">{selectedCar.make}</span>
                   <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">{selectedCar.model}</h2>
                 </div>
                 <button onClick={closeModal} className="hidden md:block text-gray-500 hover:text-white transition">
                   <i className="fa-solid fa-times text-2xl"></i>
                 </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <span className="bg-gray-800 text-white px-3 py-1 rounded font-bold text-sm">{selectedCar.year}</span>
                <span className="text-gray-400 text-sm">{selectedCar.mileage.toLocaleString()} km</span>
              </div>

              <div className="bg-brand-dark/40 rounded-xl p-4 mb-6 border border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="block text-gray-500 text-xs mb-1">Combustível</span>
                     <span className="text-white font-medium">{selectedCar.fuel}</span>
                   </div>
                   <div>
                     <span className="block text-gray-500 text-xs mb-1">Câmbio</span>
                     <span className="text-white font-medium">{selectedCar.transmission}</span>
                   </div>
                   <div>
                     <span className="block text-gray-500 text-xs mb-1">Localização</span>
                     <span className="text-white font-medium">{selectedCar.location}</span>
                   </div>
                   <div>
                     <span className="block text-gray-500 text-xs mb-1">Status</span>
                     <span className="text-green-400 font-medium">Disponível</span>
                   </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-white mb-2">Sobre o veículo</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{selectedCar.description}</p>
                <p className="text-gray-500 text-xs mt-2 italic">*Veículo periciado e aprovado. Garantia de procedência.</p>
              </div>

              <div className="mt-auto space-y-3">
                 <div className="flex justify-between items-center text-sm text-gray-500 px-1">
                    <span>FIPE: {formatCurrency(selectedCar.fipePrice)}</span>
                    <span className="text-green-500 font-bold">-{Math.round(((selectedCar.fipePrice - selectedCar.price) / selectedCar.fipePrice) * 100)}% OFF</span>
                 </div>
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-4xl font-black text-white">{formatCurrency(selectedCar.price)}</span>
                 </div>
                 
                 <button 
                   onClick={() => { addToCart(selectedCar); closeModal(); }}
                   className="w-full bg-brand-orange text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-glow hover:bg-brand-orangeHover transition transform active:scale-95 flex items-center justify-center gap-3"
                 >
                   <i className="fa-solid fa-cart-shopping"></i> Reservar Agora
                 </button>
                 <button className="w-full bg-transparent border border-gray-600 text-gray-300 font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2">
                   <i className="fa-brands fa-whatsapp"></i> Tenho Interesse
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-brand-darkRed border-t border-gray-800 text-white pt-12 pb-24 md:pb-6">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
             <div className="text-xl font-black italic tracking-tighter mb-4 text-gray-200">
              ARENA<span className="text-brand-orange">REPASSE</span>
            </div>
            <p className="text-gray-500 text-sm">
              Conectando oportunidades a investidores.
            </p>
          </div>
          <div className="col-span-1 md:col-span-2">
             <h4 className="font-bold mb-4 text-brand-orange text-sm uppercase">Atendimento</h4>
             <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><i className="fa-brands fa-whatsapp text-green-500 text-lg"></i> (11) 99999-9999</li>
              <li className="flex items-center gap-2"><i className="fa-solid fa-envelope text-brand-red text-lg"></i> contato@arenarepasse.com.br</li>
            </ul>
          </div>
          <div>
             <h4 className="font-bold mb-4 text-brand-orange text-sm uppercase">Segurança</h4>
             <div className="flex gap-3 text-2xl text-gray-500">
               <i className="fa-brands fa-cc-visa"></i>
               <i className="fa-brands fa-cc-mastercard"></i>
               <i className="fa-brands fa-pix"></i>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600 flex justify-center items-center gap-4">
          <span>&copy; 2025 Arena Repasse. Tecnologia Firebase Integrada.</span>
          
          {/* Hidden/Admin helper to re-seed if empty even if not shown in main grid */}
          <button onClick={handleSeedDatabase} className="opacity-20 hover:opacity-100 text-[10px] uppercase">
             Sync DB
          </button>
        </div>
      </footer>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-brand-surface w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-up border-l border-gray-700">
            <div className="bg-brand-darkRed p-4 flex justify-between items-center border-b border-gray-700">
              <h3 className="font-bold text-lg text-white"><i className="fa-solid fa-cart-shopping mr-2 text-brand-orange"></i> Carrinho</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white p-2"><i className="fa-solid fa-times text-xl"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4"><i className="fa-solid fa-basket-shopping text-3xl text-gray-600"></i></div>
                  <p>Seu carrinho está vazio.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 bg-brand-dark p-3 rounded-lg border border-gray-700">
                    <img src={item.image} className="w-20 h-20 object-cover rounded-md" alt={item.model} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{item.model}</h4>
                      <div className="text-xs text-gray-400 mb-1">{item.make} • {item.year}</div>
                      <div className="font-black text-brand-orange">{formatCurrency(item.price)}</div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 self-start p-1"><i className="fa-solid fa-trash"></i></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
               <div className="p-4 border-t border-gray-700 bg-brand-darkRed">
                 <div className="flex justify-between font-bold text-lg text-white mb-4"><span>Total</span><span>{formatCurrency(cart.reduce((acc, curr) => acc + curr.price, 0))}</span></div>
                 <button onClick={() => { alert('Iniciando checkout...'); setCart([]); setIsCartOpen(false); }} className="w-full bg-brand-orange text-white py-3.5 rounded-lg font-bold hover:bg-orange-600 transition shadow-glow uppercase text-sm tracking-wide">Finalizar Reserva</button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-3 z-40">
        <button className="bg-[#25D366] text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center text-2xl"><i className="fa-brands fa-whatsapp"></i></button>
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="bg-brand-red text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg hover:bg-red-800 active:scale-95 transition flex items-center justify-center text-2xl relative border-2 border-brand-orange">
          {isChatOpen ? <i className="fa-solid fa-times"></i> : <i className="fa-solid fa-robot"></i>}
        </button>
      </div>

      {/* CHAT WIDGET */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 bg-brand-surface rounded-xl shadow-2xl z-40 flex flex-col border border-gray-700 overflow-hidden animate-slide-up" style={{height: '500px', maxHeight: '70vh'}}>
          <div className="bg-brand-darkRed p-4 flex items-center gap-3 border-b border-gray-700">
            <div className="w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center text-white text-sm"><i className="fa-solid fa-robot"></i></div>
            <div><h4 className="font-bold text-white text-sm">Assistente Arena</h4><p className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online</p></div>
          </div>
          <div className="flex-1 bg-brand-dark p-4 overflow-y-auto space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand-orange text-white rounded-br-sm' : 'bg-brand-surface text-gray-200 border border-gray-700 rounded-bl-sm'} whitespace-pre-line`}>
                   {msg.text.includes('http') ? (<span>{msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => part.match(/https?:\/\/[^\s]+/) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">{part}</a> : part)}</span>) : msg.text}
                </div>
              </div>
            ))}
            {isTyping && (<div className="flex justify-start"><div className="bg-brand-surface p-3 rounded-2xl border border-gray-700 rounded-bl-sm"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></div></div></div></div>)}
            <div ref={chatEndRef}></div>
          </div>
          <div className="p-3 bg-brand-surface border-t border-gray-700 flex gap-2">
            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Digite sua dúvida..." className="flex-1 bg-brand-dark border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-orange placeholder-gray-600"/>
            <button onClick={handleSendMessage} disabled={isTyping} className="bg-brand-red text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-800 disabled:opacity-50 transition"><i className="fa-solid fa-paper-plane text-xs"></i></button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
