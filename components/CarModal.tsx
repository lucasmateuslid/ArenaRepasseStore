
import React, { useState } from 'react';
import { Car } from '../types';

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
  const images = (car.gallery && car.gallery.length > 0) ? car.gallery : [car.image];
  
  const displayYear = car.year === 32000 ? 'Zero KM' : car.year;

  // Geração de URL Específica para Deep Linking
  const baseUrl = window.location.href.split('?')[0]; // Pega a URL base sem query params antigos
  const shareUrl = `${baseUrl}?carId=${car.id}`;
  
  const shareText = `Confira este ${car.make} ${car.model} ${displayYear} por ${formatCurrency(price)} no Arena Repasse!`;
  
  const handleCopyLink = () => {
    const textToCopy = `${shareText} Acesse: ${shareUrl}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyStatus('Copiado!');
      setTimeout(() => setCopyStatus('Copiar Link'), 2000);
    });
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
              <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 bg-gray-700/30 hover:bg-gray-700 text-gray-400 hover:text-white py-2 rounded-lg transition text-xs font-bold border border-gray-700">
                <i className={`fa-solid ${copyStatus === 'Copiado!' ? 'fa-check' : 'fa-link'}`}></i> {copyStatus}
              </button>
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-2 border-t border-gray-800/50">
             <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                <span>FIPE: {formatCurrency(fipe)}</span>
                {discount > 0 && <span className="text-green-500 font-bold">-{discount}% OFF</span>}
             </div>
             <div className="flex items-center justify-between mb-2">
               <span className="text-3xl md:text-4xl font-black text-white tracking-tight">{formatCurrency(price)}</span>
             </div>
             <button 
               onClick={() => handleWhatsApp(car)}
               className="w-full bg-[#25D366] text-white font-black uppercase tracking-wider py-3 md:py-4 rounded-xl shadow-glow hover:brightness-110 transition transform active:scale-95 flex items-center justify-center gap-2"
             >
               <i className="fa-brands fa-whatsapp text-lg md:text-xl"></i> 
               <span>Negociar no WhatsApp</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
