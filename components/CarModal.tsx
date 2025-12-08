
import React, { useState } from 'react';
import { Car } from '../types';
import { encodeCarUrl } from '../utils/urlHelpers';

interface CarModalProps {
  car: Car | null;
  onClose: () => void;
  handleWhatsApp: (car: Car) => void;
  formatCurrency: (val: number) => string;
}

export const CarModal: React.FC<CarModalProps> = ({ car, onClose, handleWhatsApp, formatCurrency }) => {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [copyStatus, setCopyStatus] = useState<string>('Copiar Link');

  React.useEffect(() => {
    setSelectedImageIndex(0);
    setCopyStatus('Copiar Link');
  }, [car]);

  if (!car) return null;

  const fipe = Number(car.fipeprice) || 0;
  const price = Number(car.price) || 0;
  const discount = fipe > 0 ? Math.round(((fipe - price) / fipe) * 100) : 0;
  const economy = fipe - price;
  const images = (car.gallery && car.gallery.length > 0) ? car.gallery : [car.image];
  
  const displayYear = car.year === 32000 ? 'Zero KM' : car.year;

  // Geração de URL Específica Amigável (Mascarada)
  const generateShareUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const prettyParam = encodeCarUrl(car.id, car.make, car.model, car.year);
    return `${origin}${pathname}#/?v=${prettyParam}`;
  };

  const shareUrl = generateShareUrl();
  const shareText = `Confira este ${car.make} ${car.model} ${displayYear} por ${formatCurrency(price)} no Arena Repasse!`;
  
  const handleCopyLink = async () => {
    const textToCopy = shareUrl;

    const copyFallback = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopyStatus('Copiado!');
        } else {
          setCopyStatus('Erro');
        }
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        setCopyStatus('Erro');
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopyStatus('Copiado!');
      } catch (err) {
        copyFallback(textToCopy);
      }
    } else {
      copyFallback(textToCopy);
    }

    setTimeout(() => setCopyStatus('Copiar Link'), 2500);
  };

  const shareToSocial = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    let url = '';
    const text = encodeURIComponent(shareText);
    const link = encodeURIComponent(shareUrl);

    if (platform === 'whatsapp') {
      url = `https://wa.me/?text=${text}%20${link}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${text}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-brand-surface w-full md:max-w-5xl h-full md:h-auto md:max-h-[95vh] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 md:hidden bg-black/60 text-white p-2 rounded-full backdrop-blur-sm">
          <i className="fa-solid fa-times text-xl"></i>
        </button>
        <div className="w-full md:w-3/5 bg-zinc-950 flex flex-col relative justify-center">
          <div className="relative w-full h-[40vh] md:h-[60vh] md:flex-1 bg-black flex items-center justify-center overflow-hidden">
             <img 
                src={images[selectedImageIndex]} 
                className="max-w-full max-h-full object-contain" 
                alt={`${car.model} view ${selectedImageIndex + 1}`}
                // @ts-ignore
                fetchpriority="high"
                loading="eager"
                decoding="async"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }}
             />
             {images.length > 1 && (
               <>
                 <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-brand-orange transition active:scale-95" 
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}>
                    <i className="fa-solid fa-chevron-left"></i>
                 </button>
                 <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-brand-orange transition active:scale-95"
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}>
                    <i className="fa-solid fa-chevron-right"></i>
                 </button>
               </>
             )}
          </div>
          <div className="h-16 md:h-20 bg-zinc-900/90 flex items-center gap-2 p-2 overflow-x-auto no-scrollbar justify-center md:justify-start border-t border-gray-800">
            {images.map((img, idx) => (
              <img 
                key={idx}
                src={img}
                loading="lazy"
                className={`h-12 md:h-16 w-16 md:w-24 object-cover rounded cursor-pointer border-2 transition-all ${selectedImageIndex === idx ? 'border-brand-orange opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                onClick={() => setSelectedImageIndex(idx)}
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; }}
              />
            ))}
          </div>
        </div>
        <div className="w-full md:w-2/5 p-5 md:p-8 overflow-y-auto bg-brand-surface flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
             <div>
               <span className="text-brand-orange font-bold text-xs md:text-sm tracking-wider uppercase mb-1 block">{car.make}</span>
               <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{car.model}</h2>
             </div>
             <button onClick={onClose} className="hidden md:block text-gray-500 hover:text-white transition">
               <i className="fa-solid fa-times text-2xl"></i>
             </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-gray-800 text-white px-3 py-1 rounded font-bold text-xs md:text-sm">{displayYear}</span>
            <span className="text-gray-400 text-xs md:text-sm">{car.mileage.toLocaleString()} km</span>
          </div>
          <div className="bg-brand-dark/40 rounded-xl p-3 md:p-4 mb-4 border border-gray-700">
            <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
               <div><span className="block text-gray-500 text-[10px] uppercase mb-1">Combustível</span><span className="text-white font-medium">{car.fuel}</span></div>
               <div><span className="block text-gray-500 text-[10px] uppercase mb-1">Câmbio</span><span className="text-white font-medium">{car.transmission}</span></div>
               <div><span className="block text-gray-500 text-[10px] uppercase mb-1">Localização</span><span className="text-white font-medium">{car.location || 'Brasil'}</span></div>
               <div><span className="block text-gray-500 text-[10px] uppercase mb-1">Status</span><span className="text-green-400 font-medium">Disponível</span></div>
            </div>
          </div>
          <div className="mb-4 flex-1">
            <h4 className="font-bold text-white mb-2 text-sm">Sobre o veículo</h4>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-4 md:line-clamp-none">{car.description}</p>
          </div>

          {/* Share Section */}
          <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <h4 className="font-bold text-gray-400 text-xs uppercase mb-3 flex items-center gap-2">
              <i className="fa-solid fa-share-nodes"></i> Compartilhar Oferta
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => shareToSocial('whatsapp')} className="flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white py-2 rounded-lg transition text-xs font-bold border border-green-600/30">
                <i className="fa-brands fa-whatsapp text-base"></i> WhatsApp
              </button>
              <button onClick={() => shareToSocial('facebook')} className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white py-2 rounded-lg transition text-xs font-bold border border-blue-600/30">
                <i className="fa-brands fa-facebook text-base"></i> Facebook
              </button>
              <button 
                onClick={handleCopyLink} 
                className={`flex items-center justify-center gap-2 py-2 rounded-lg transition text-xs font-bold border ${
                  copyStatus === 'Copiado!' 
                    ? 'bg-green-500 text-white border-green-500' 
                    : copyStatus === 'Erro'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-gray-700/30 hover:bg-gray-700 text-gray-400 hover:text-white border-gray-700'
                }`}
              >
                <i className={`fa-solid ${copyStatus === 'Copiado!' ? 'fa-check' : copyStatus === 'Erro' ? 'fa-exclamation-circle' : 'fa-link'}`}></i> 
                {copyStatus}
              </button>
            </div>
          </div>

          {/* Price & Action Section */}
          <div className="mt-auto pt-4 border-t border-gray-800/50">
             
             {/* Info Financeira Destacada */}
             <div className="flex flex-col gap-2 mb-3 bg-black/30 p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-500">TABELA FIPE</span>
                   <span className="text-sm font-bold text-red-500/70 line-through decoration-red-500/50">{formatCurrency(fipe)}</span>
                </div>
                {economy > 0 && (
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-black text-green-500 uppercase">Sua Economia</span>
                     <span className="text-sm font-black text-white bg-green-600 px-2 py-0.5 rounded shadow-lg">{formatCurrency(economy)}</span>
                  </div>
                )}
             </div>

             <div className="flex items-center justify-between mb-4">
               <div>
                 <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Preço de Repasse</span>
                 <span className="text-3xl md:text-4xl font-black text-white tracking-tight">{formatCurrency(price)}</span>
               </div>
               {discount > 0 && <span className="bg-brand-orange text-white text-sm font-black px-3 py-1 rounded-full animate-pulse">-{discount}% OFF</span>}
             </div>

             <button 
               onClick={() => handleWhatsApp(car)}
               className="w-full bg-[#25D366] hover:bg-[#1dbf57] text-white font-black uppercase tracking-wider py-3 md:py-4 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] transition transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 text-lg"
             >
               <i className="fa-brands fa-whatsapp text-2xl"></i> 
               <span>Negociar no WhatsApp</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
