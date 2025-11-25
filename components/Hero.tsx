
import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-brand-dark min-h-[550px] md:min-h-[650px] flex items-center pt-8 md:pt-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-red/20 via-brand-dark to-black z-0"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay z-0"></div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand-dark to-transparent z-10"></div>
      
      <div className="container mx-auto px-4 relative z-20 flex flex-col md:flex-row items-center gap-12">
        
        <div className="w-full md:w-1/2 space-y-6 animate-slide-up text-center md:text-left pt-10 md:pt-0">
          <div className="inline-block bg-brand-orange/20 border border-brand-orange/50 text-brand-orange px-4 py-1.5 text-xs md:text-sm font-black uppercase rounded-full shadow-glow backdrop-blur-sm">
            <i className="fa-solid fa-fire mr-2"></i> Ofertas por tempo limitado
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] italic tracking-tighter text-white drop-shadow-lg">
            FEIRÃO DE <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-red-500">REPASSE</span> <br/>
            O ANO TODO
          </h1>
          
          <p className="text-gray-300 text-lg md:text-2xl font-light border-l-4 border-brand-orange pl-6 max-w-xl mx-auto md:mx-0 leading-snug">
            Carros abaixo da FIPE. A fonte secreta das concessionárias agora esperando por você.
          </p>

          <div className="flex flex-col md:flex-row gap-4 pt-4 justify-center md:justify-start">
            <button onClick={() => document.getElementById('inventory')?.scrollIntoView({behavior: 'smooth'})} className="bg-brand-orange hover:bg-red-600 text-white font-black uppercase text-lg px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] transition-all transform hover:-translate-y-1 active:scale-95">
              Ver Estoque Agora
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center relative mt-8 md:mt-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-brand-red/20 blur-[100px] rounded-full animate-pulse"></div>
          
          <img 
            src="https://www.globorenault.com.br/imagens/img_veic/veiculo-renault-521.png" 
            alt="Carro de Repasse" 
            className="relative w-full max-w-3xl md:scale-125 lg:scale-135 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 animate-fade-in transform transition duration-1000 hover:scale-[1.3] hover:-rotate-1"
            width="800"
            height="600"
            fetchPriority="high"
            loading="eager"
          />
          
          <div className="absolute top-0 right-10 md:right-0 bg-brand-surface/90 backdrop-blur border border-gray-700 p-3 rounded-lg shadow-xl z-20 animate-bounce hidden md:block">
            <span className="block text-xs text-gray-400 font-bold uppercase">Descontos de até</span>
            <span className="text-2xl font-black text-yellow-400">30% OFF</span>
          </div>
        </div>
      </div>
    </section>
  );
};
