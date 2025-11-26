
import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-brand-dark min-h-[600px] md:min-h-[650px] flex items-center pt-4 md:pt-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-red/20 via-brand-dark to-black z-0"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay z-0"></div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand-dark to-transparent z-10"></div>
      
      <div className="container mx-auto px-4 relative z-20 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="w-full md:w-1/2 space-y-4 md:space-y-6 animate-slide-up text-center md:text-left pt-6 md:pt-0 relative z-20">
          <div className="inline-block bg-brand-orange/20 border border-brand-orange/50 text-brand-orange px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-sm font-black uppercase rounded-full shadow-glow backdrop-blur-sm">
            <i className="fa-solid fa-fire mr-2"></i> Novas Ofertas Toda Semana!
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] italic tracking-tighter text-white drop-shadow-lg">
            FEIRÃO DE <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-red-500">REPASSE</span> <br/>
            O ANO TODO
          </h1>
          <p className="text-gray-300 text-base sm:text-lg md:text-2xl font-light md:border-l-4 border-brand-orange md:pl-6 max-w-xl mx-auto md:mx-0 leading-snug">
            Carros abaixo da FIPE. A fonte secreta das concessionárias agora esperando por você.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
            <button onClick={() => document.getElementById('inventory')?.scrollIntoView({behavior: 'smooth'})} className="bg-brand-orange hover:bg-red-600 text-white font-black uppercase text-base md:text-lg px-8 py-3 md:py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] transition-all transform hover:-translate-y-1 active:scale-95 w-full sm:w-auto">
              Ver Estoque Agora
            </button>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 flex justify-center relative mt-4 md:mt-0">
          {/* Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-red/20 blur-[80px] rounded-full animate-pulse"></div>
          
          <img 
            src="https://www.globorenault.com.br/imagens/img_veic/veiculo-renault-521.png" 
            alt="Carro de Repasse" 
            className="relative w-[110%] max-w-none md:w-full md:max-w-3xl md:scale-125 lg:scale-135 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] z-10 animate-fade-in transform transition duration-1000 hover:scale-[1.15] md:hover:scale-[1.3] hover:-rotate-1 object-contain"
            width="800"
            height="600"
            fetchPriority="high"
            loading="eager"
          />

          {/* Badge Mobile & Desktop */}
          <div className="absolute -top-4 right-0 scale-75 md:scale-100 md:top-0 md:-right-6 bg-brand-surface/90 backdrop-blur border-2 border-brand-orange/30 p-4 md:p-6 rounded-2xl shadow-2xl z-20 animate-bounce transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="block text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest text-center mb-1">Descontos de até</span>
            <span className="block text-3xl md:text-5xl font-black text-yellow-400 leading-none drop-shadow-md whitespace-nowrap">30% OFF</span>
          </div>
        </div>
      </div>
    </section>
  );
};
