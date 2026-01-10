
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Car } from '../types';
import { encodeCarUrl } from '../utils/urlHelpers';
import { 
  FaWhatsapp, FaTimes, FaCalendarAlt, FaGasPump, FaCogs, 
  FaTachometerAlt, FaIdCard, FaCheckCircle, FaChevronLeft, 
  FaChevronRight, FaCar, FaShareAlt, FaPlus, FaArrowDown,
  FaExpand, FaFacebookF, FaTwitter, FaLink
} from 'react-icons/fa';

interface CarModalProps {
  car: Car | null;
  onClose: () => void;
  handleWhatsApp: (car: Car) => void;
  formatCurrency: (val: number) => string;
}

export const CarModal: React.FC<CarModalProps> = ({ car, onClose, handleWhatsApp, formatCurrency }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInternalScroll = useRef(false);

  const allImages = car ? [car.image, ...(car.gallery || [])].filter(img => !!img) : [];
  const shareUrl = car ? `${window.location.origin}/#/?v=${encodeCarUrl(car.id, car.make, car.model, car.year)}` : '';

  useEffect(() => {
    if (car) {
      setActiveImage(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [car]);

  // Sincroniza o scroll do mobile quando o activeImage muda via botões
  useEffect(() => {
    if (scrollRef.current && isInternalScroll.current) {
      const container = scrollRef.current;
      const targetScroll = activeImage * container.offsetWidth;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
      
      // Reseta a flag após o tempo da animação
      const timer = setTimeout(() => {
        isInternalScroll.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeImage]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const nextLightboxImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevLightboxImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, nextLightboxImage, prevLightboxImage]);

  const nextImage = useCallback(() => {
    isInternalScroll.current = true;
    setActiveImage((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevImage = useCallback(() => {
    isInternalScroll.current = true;
    setActiveImage((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Só atualiza o estado se for scroll manual (dedo)
    if (isInternalScroll.current) return;
    
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== activeImage) setActiveImage(newIndex);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (!car) return null;

  const price = Number(car.price) || 0;
  const fipe = Number(car.fipeprice) || 0;

  const shareActions = [
    { 
      label: 'WHATS', 
      icon: FaWhatsapp, 
      color: 'border-green-500/20 text-green-500 bg-green-500/5', 
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Confira este ${car.model}: ${shareUrl}`)}`, '_blank') 
    },
    { 
      label: 'FACE', 
      icon: FaFacebookF, 
      color: 'border-blue-500/20 text-blue-500 bg-blue-500/5', 
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank') 
    },
    { 
      label: 'TWITTER', 
      icon: FaTwitter, 
      color: 'border-gray-700 text-gray-400 bg-gray-800/10', 
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Confira este ${car.model} na Arena Repasse!`)}`, '_blank') 
    },
    { 
      label: 'LINK', 
      icon: FaLink, 
      color: copyFeedback ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-gray-700 text-gray-400 bg-gray-800/10', 
      action: copyLink 
    },
  ];

  const specs = [
    { label: 'MODELO', value: car.model, icon: FaCar },
    { label: 'FINAL PLACA', value: car.licensePlate ? car.licensePlate.slice(-1) : 'N/I', icon: FaIdCard },
    { label: 'QUILOMETRAGEM', value: `${car.mileage?.toLocaleString() || 0} km`, icon: FaTachometerAlt },
    { label: 'ANO', value: car.year === 32000 ? 'ZERO KM' : car.year, icon: FaCalendarAlt },
    { label: 'CÂMBIO', value: car.transmission, icon: FaCogs },
    { label: 'COMBUSTÍVEL', value: car.fuel, icon: FaGasPump },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in overflow-hidden">
      <div className="absolute inset-0 bg-black/98" onClick={onClose}></div>
      
      <div className="relative bg-brand-dark w-full h-full md:h-auto md:max-h-[92vh] md:max-w-6xl md:rounded-[2.5rem] shadow-2xl flex flex-col animate-slide-up border border-white/5 overflow-hidden">
        
        {/* BOTÃO FECHAR */}
        <button onClick={onClose} className="fixed md:absolute top-4 right-4 z-[110] bg-black/60 md:bg-white/10 p-3 rounded-full text-white border border-white/10 backdrop-blur-md hover:bg-brand-orange transition-colors">
          <FaTimes size={18} />
        </button>

        {/* CONTAINER DE SCROLL DO CONTEÚDO */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* --- HEADER --- */}
          <div className="p-6 md:p-10 pt-16 md:pt-10 flex flex-col gap-1">
            <span className="text-brand-orange font-black uppercase text-[10px] tracking-[0.4em]">{car.make}</span>
            <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              {car.model}
            </h2>
            <div className="text-4xl md:text-6xl font-black text-white tracking-tighter mt-4 italic">
              {formatCurrency(price)}
            </div>
          </div>

          {/* --- GALERIA DE FOTOS --- */}
          <div className="mb-8">
            {/* DESKTOP BENTO GRID */}
            <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 h-[500px] px-10">
              <div 
                onClick={() => openLightbox(activeImage)}
                className="col-span-2 row-span-2 relative rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl group cursor-pointer"
              >
                 <img 
                   src={allImages[activeImage]} 
                   className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                   alt="Principal" 
                 />
                 <div className="absolute bottom-6 right-6 flex gap-2">
                    <div className="bg-black/60 p-3 rounded-xl hover:bg-brand-orange transition text-white">
                       <FaExpand size={14} />
                    </div>
                 </div>
                 <div className="absolute top-6 left-6 bg-black/60 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                    {activeImage + 1} / {allImages.length}
                 </div>
              </div>
              
              {allImages.slice(1, 5).map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => { setActiveImage(i + 1); openLightbox(i + 1); }}
                  className="relative rounded-2xl overflow-hidden border border-white/5 group cursor-pointer"
                >
                   <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={`Miniatura ${i}`} />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                   {i === 3 && allImages.length > 5 && (
                     <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white font-black text-[10px] uppercase tracking-widest backdrop-blur-sm">
                        <FaPlus className="mb-1 text-lg" /> {allImages.length - 5} FOTOS
                     </div>
                   )}
                </div>
              ))}
            </div>

            {/* MOBILE SLIDER SNAP COM CORREÇÃO DE SETAS */}
            <div className="md:hidden relative px-4">
              <div 
                ref={scrollRef}
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-[50vh] rounded-[2rem] border border-white/10 shadow-2xl bg-black/20"
              >
                {allImages.map((img, i) => (
                  <div key={i} onClick={() => openLightbox(i)} className="w-full h-full flex-shrink-0 snap-center relative">
                    <img src={img} className="w-full h-full object-cover" alt={`Slide ${i}`} />
                  </div>
                ))}
              </div>
              
              <div className="absolute inset-y-0 left-8 right-8 flex items-center justify-between pointer-events-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                  className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-auto active:scale-90 transition backdrop-blur-md border border-white/10 shadow-xl"
                >
                  <FaChevronLeft size={14}/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                  className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-auto active:scale-90 transition backdrop-blur-md border border-white/10 shadow-xl"
                >
                  <FaChevronRight size={14}/>
                </button>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                {activeImage + 1} / {allImages.length}
              </div>
            </div>
          </div>

          {/* --- CONTEÚDO --- */}
          <div className="p-6 md:p-10 space-y-12 pb-10">
            {/* FICHA TÉCNICA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specs.map((item, idx) => (
                <div key={idx} className="bg-[#111111] border border-white/5 p-6 rounded-[1.5rem] flex items-center gap-5 group hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-brand-orange shadow-inner">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{item.label}</span>
                    <span className="block text-sm font-black text-white uppercase italic tracking-tight">{item.value || 'N/I'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* COMPARTILHAR OFERTA */}
            <div className="bg-[#0a0a0b] border border-white/5 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h5 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] flex items-center gap-3">
                  <FaShareAlt className="text-brand-orange text-lg"/> COMPARTILHAR OFERTA
                </h5>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">ENVIAR P/ AMIGO</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3 md:gap-5">
                {shareActions.map((btn, i) => (
                  <button 
                    key={i} 
                    onClick={btn.action}
                    className={`flex flex-col items-center justify-center gap-4 py-6 rounded-[1.5rem] border transition-all active:scale-95 group ${btn.color}`}
                  >
                    <btn.icon size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black tracking-[0.2em]">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DETALHES */}
            <div className="mb-20">
              <h4 className="text-white font-black text-[11px] uppercase italic tracking-widest mb-6 flex items-center gap-3">
                <span className="w-10 h-[2px] bg-brand-orange"></span> DETALHES:
              </h4>
              <div className="bg-[#111111] border border-white/5 p-8 rounded-[2rem] leading-relaxed">
                 <p className="text-gray-400 text-sm font-medium whitespace-pre-line italic">
                   {car.description || 'Nenhuma descrição detalhada disponível para este veículo.'}
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ TRAVADO NO FUNDO */}
        <div className="bg-[#050505] border-t border-white/10 px-6 py-6 md:px-12 md:py-8 z-[120] flex items-center justify-between gap-3 shadow-[0_-15px_40px_rgba(0,0,0,0.8)]">
           <div className="hidden md:flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preço Arena Repasse</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-white italic tracking-tighter">{formatCurrency(price)}</span>
              </div>
           </div>

           <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => handleWhatsApp(car)}
                className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-5 rounded-3xl font-black uppercase text-xs md:text-sm shadow-xl flex items-center justify-center gap-3 italic tracking-tight active:scale-95 transition-all"
              >
                <FaWhatsapp size={22} className="hidden sm:block" /> NEGOCIAR NO WHATSAPP
              </button>
              
              <button 
                onClick={copyLink}
                className="w-16 h-16 bg-white/5 border border-white/10 text-white rounded-3xl flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0 active:scale-90 shadow-lg"
              >
                <FaLink size={20} className={copyFeedback ? 'text-green-500' : ''} />
              </button>
           </div>
        </div>
      </div>

      {/* LIGHTBOX COM NAVEGAÇÃO */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 p-4 animate-fade-in cursor-default" 
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white p-4 bg-white/5 hover:bg-brand-orange rounded-full transition-colors z-[210] shadow-xl border border-white/10"
            onClick={() => setIsLightboxOpen(false)}
          >
            <FaTimes size={28}/>
          </button>
          
          <div className="relative max-w-7xl max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <img 
               src={allImages[lightboxIndex]} 
               className="max-w-full max-h-full object-contain shadow-[0_0_80px_rgba(0,0,0,1)] rounded-xl border border-white/5" 
               alt="Lightbox" 
             />
             
             <button 
                onClick={prevLightboxImage}
                className="absolute -left-16 lg:flex hidden w-14 h-14 bg-white/5 hover:bg-brand-orange border border-white/10 rounded-full items-center justify-center text-white transition-all shadow-2xl active:scale-90"
             >
               <FaChevronLeft size={24}/>
             </button>
             <button 
                onClick={nextLightboxImage}
                className="absolute -right-16 lg:flex hidden w-14 h-14 bg-white/5 hover:bg-brand-orange border border-white/10 rounded-full items-center justify-center text-white transition-all shadow-2xl active:scale-90"
             >
               <FaChevronRight size={24}/>
             </button>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 rounded-full text-[11px] font-black text-white uppercase tracking-[0.4em] border border-white/10 backdrop-blur-md">
            {lightboxIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </div>
  );
};
