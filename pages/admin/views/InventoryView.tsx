
import React, { useState } from 'react';
import { FaPlus, FaFilter, FaTrash, FaBan, FaMagic, FaCopy, FaWhatsapp, FaTimes, FaCheck, FaEdit, FaMobileAlt, FaImage, FaCalculator, FaShareAlt } from 'react-icons/fa';
import { GoogleGenAI } from "@google/genai";
import { Car } from '../../../types';
import { SectionHeader } from '../components/AdminUI';
import { getEnv } from '../../../utils/env';

interface InventoryViewProps {
  cars: Car[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onNew: () => void;
  onEdit: (car: Car) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (car: Car) => void;
  isAdmin: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  cars, searchTerm, setSearchTerm, onNew, onEdit, onDelete, onToggleStatus, isAdmin 
}) => {
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [benefits, setBenefits] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const filteredCars = cars.filter((c: Car) => 
    c.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status?.includes(searchTerm.toLowerCase()) ||
    c.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sold': return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-green-500/10 text-green-500 border-green-500">Vendido</span>;
      case 'maintenance': return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-orange-500/10 text-orange-500 border-orange-500">Manutenção</span>;
      case 'unavailable': return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-gray-500/10 text-gray-500 border-gray-500">Indisp.</span>;
      default: return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-blue-500/10 text-blue-500 border-blue-500">Disponível</span>;
    }
  };

  const displayYear = (year: number) => year === 32000 ? 'Zero KM' : year;

  // --- LÓGICA DO GERADOR IA ---
  const openSalesModal = (car: Car) => {
    setSelectedCar(car);
    setBenefits("✅ Único Dono\n✅ Revisado na concessionária\n✅ Manual e chave reserva\n✅ IPVA 2024 Pago\n✅ Sem leilão / Sem sinistro");
    setGeneratedText('');
    setIsSalesModalOpen(true);
  };

  const handleGenerateText = async () => {
    if (!selectedCar) return;
    setIsGenerating(true);

    try {
      // Correctly use process.env.API_KEY directly for Google GenAI as per guidelines.
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error('API Key não configurada');

      // Initialize GoogleGenAI with a named parameter.
      const ai = new GoogleGenAI({ apiKey });
      
      const displayYearVal = selectedCar.year === 32000 ? 'Zero KM' : selectedCar.year;
      const fipeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCar.fipeprice || 0);
      const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCar.price || 0);
      const kmFormatted = selectedCar.mileage.toLocaleString('pt-BR');
      const diff = (selectedCar.fipeprice || 0) - (selectedCar.price || 0);
      const diffFormatted = diff > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diff) : 'Valor Exclusivo';

      const prompt = `
        Atue como o melhor vendedor de repasse automotivo. Crie um anúncio de ALTA PERFORMANCE para grupos de WhatsApp de investidores.
        
        VEÍCULO: ${selectedCar.make} ${selectedCar.model}
        ANO: ${displayYearVal} | KM: ${kmFormatted}
        FIPE: ${fipeFormatted} | REPASSE: ${priceFormatted}
        MARGEM/ECONOMIA: ${diffFormatted} ABAIXO DA FIPE
        
        ESTADO/DIFERENCIAIS:
        ${benefits}

        REGRAS DE FORMATAÇÃO WHATSAPP:
        - Título em caixa alta entre asteriscos: *[MODELO]*
        - Use emojis que remetem a urgência (🔥, 🚨, 💰, 🚀).
        - Destaque o valor do Repasse em NEGRITO.
        - FOCO TOTAL na margem de lucro para o comprador.
        - Não use "Olá", vá direto ao ponto.
        - Termine com: "Chama agora no privado! 🏃💨"

        ESTRUTURA:
        🚨 *OPORTUNIDADE DE REPASSE* 🔥
        *${selectedCar.model.toUpperCase()}*
        📅 ${displayYearVal} | 🛣 ${kmFormatted}km

        ${benefits}

        📉 Fipe: ${fipeFormatted}
        💰 *REPASSE: ${priceFormatted}*
        🎁 Economia real: *${diffFormatted} OFF*

        Atenção: Carro de giro rápido. Primeiro que chegar leva! 🏁
      `;

      const response = await ai.models.generateContent({
        // Use recommended model for text generation tasks.
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      // Correctly access the .text property (do not call as a function).
      const resultText = response.text;
      setGeneratedText((resultText || '').trim());

    } catch (error) {
      console.error(error);
      setGeneratedText("Erro ao gerar texto automágico. Verifique as chaves de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // --- NOVA FUNÇÃO: ENVIAR COM IMAGEM ---
  const shareToWhatsApp = async () => {
    if (!selectedCar || !generatedText) return;
    setIsSharing(true);

    try {
      // 1. Prepara a imagem (converte URL para Blob -> File)
      const response = await fetch(selectedCar.image);
      const blob = await response.blob();
      const file = new File([blob], `${selectedCar.model.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });

      // 2. Verifica se o navegador suporta compartilhamento de arquivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: generatedText,
          title: `Oferta: ${selectedCar.model}`
        });
      } else {
        // Fallback: Apenas texto via link se não suportar arquivos
        const url = `https://wa.me/?text=${encodeURIComponent(generatedText)}`;
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Fallback final
      const url = `https://wa.me/?text=${encodeURIComponent(generatedText)}`;
      window.open(url, '_blank');
    } finally {
      setIsSharing(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0 relative">
      <SectionHeader 
        title="Estoque Arena" 
        subtitle="Gerenciamento de frota e inteligência de vendas"
        action={
          isAdmin && (
            <button onClick={onNew} className="bg-brand-orange hover:bg-brand-orangeHover text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow transition transform active:scale-95 w-full md:w-auto justify-center">
              <FaPlus /> Novo Veículo
            </button>
          )
        }
      />

      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 bg-black/20">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder="Pesquisar estoque..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-black/40 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-brand-orange outline-none" 
            />
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-800">
          {filteredCars.map((c: Car) => (
            <div key={c.id} className="p-4 flex gap-4 bg-brand-surface">
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 relative">
                <img src={c.image} alt={c.model} className="w-full h-full object-cover" />
                {c.status !== 'available' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><FaBan className="text-white"/></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-white text-sm truncate">{c.make} {c.model}</h4>
                  {getStatusBadge(c.status || 'available')}
                </div>
                <p className="text-brand-orange font-bold text-sm mb-2">R$ {c.price.toLocaleString('pt-BR')}</p>
                
                <div className="flex gap-2">
                   <button onClick={() => openSalesModal(c)} className="px-3 py-2 bg-purple-600/10 text-purple-400 border border-purple-500/30 rounded-lg transition" title="Gerar Anúncio">
                      <FaMagic />
                   </button>
                   <button onClick={() => onEdit(c)} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg text-xs font-medium border border-gray-700 flex items-center justify-center gap-2">
                      <FaEdit/> Editar
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Venda</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {filteredCars.map((c: Car) => (
                <tr key={c.id} className="hover:bg-white/5 transition group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <img src={c.image} className="w-12 h-12 rounded-lg object-cover bg-gray-900 border border-gray-800 shadow-lg" />
                    <div>
                      <span className="font-bold text-white block">{c.model}</span>
                      <span className="text-xs text-brand-orange font-medium">{c.make} • {displayYear(c.year)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(c.status || 'available')}</td>
                  <td className="px-6 py-4"><p className="font-bold text-white">R$ {c.price.toLocaleString('pt-BR')}</p></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition">
                       <button onClick={() => openSalesModal(c)} className="p-2 text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-600 rounded-lg transition" title="IA Marketing">
                         <FaMagic/>
                       </button>
                       <button onClick={() => onEdit(c)} className="px-3 py-1.5 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition text-xs font-bold uppercase">
                         Gerenciar
                       </button>
                       {isAdmin && (
                         <button onClick={() => onDelete(c.id)} className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition">
                           <FaTrash/>
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL GERADOR E SIMULADOR DE WHATSAPP --- */}
      {isSalesModalOpen && selectedCar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsSalesModalOpen(false)}></div>
          
          <div className="relative bg-[#0b141a] w-full max-w-6xl h-full md:h-auto md:max-h-[95vh] md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
            
            {/* LADO ESQUERDO: CONFIG E RESULTADO */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 border-r border-white/10 overflow-y-auto custom-scrollbar bg-[#0f171e]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <FaMagic className="text-brand-orange animate-pulse"/> Marketing Inteligente
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Gere anúncios que vendem sozinhos</p>
                </div>
                <button onClick={() => setIsSalesModalOpen(false)} className="lg:hidden text-gray-500 hover:text-white p-2">
                  <FaTimes size={24}/>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                     <span className="block text-[10px] text-gray-500 uppercase font-black mb-1">Avaliação Fipe</span>
                     <p className="text-white font-black">{formatCurrency(selectedCar.fipeprice)}</p>
                  </div>
                  <div className="bg-brand-orange/10 p-4 rounded-2xl border border-brand-orange/20">
                     <span className="block text-[10px] text-brand-orange uppercase font-black mb-1">Margem Real</span>
                     <p className="text-white font-black">{formatCurrency((selectedCar.fipeprice || 0) - (selectedCar.price || 0))}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Observações do Veículo</label>
                  <textarea 
                    value={benefits} 
                    onChange={(e) => setBenefits(e.target.value)}
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-brand-orange outline-none resize-none transition-all placeholder-gray-700"
                    placeholder="Ex: Pneus Michelin Novos, Sem retoques..."
                  />
                </div>

                {!generatedText ? (
                  <button 
                    onClick={handleGenerateText} 
                    disabled={isGenerating}
                    className="w-full py-5 bg-brand-orange hover:bg-brand-orangeHover text-white font-black uppercase tracking-widest rounded-2xl shadow-glow transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isGenerating ? <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Criando Mágica...</div> : <><FaMagic/> Criar Anúncio de Repasse</>}
                  </button>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-black/40 border border-green-500/30 rounded-2xl p-4">
                       <label className="text-[10px] font-black text-green-500 uppercase mb-2 block">Texto Gerado</label>
                       <textarea 
                          value={generatedText} 
                          onChange={(e) => setGeneratedText(e.target.value)}
                          className="w-full h-48 bg-transparent text-sm text-white outline-none resize-none font-sans leading-relaxed"
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={copyToClipboard} className="h-14 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 border border-white/10">
                        {copyFeedback ? <><FaCheck className="text-green-500"/> Copiado!</> : <><FaCopy/> Copiar Texto</>}
                      </button>
                      <button 
                        onClick={shareToWhatsApp} 
                        disabled={isSharing}
                        className="h-14 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-70"
                      >
                        {isSharing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaWhatsapp size={20}/> Enviar Agora</>}
                      </button>
                    </div>
                    <button onClick={handleGenerateText} className="w-full py-3 text-gray-500 hover:text-white transition text-[10px] uppercase font-black flex items-center justify-center gap-2">
                      <FaMagic/> Tentar outra versão
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* LADO DIREITO: PREVIEW ULTRA-REALISTA */}
            <div className="w-full lg:w-1/2 bg-[#0d141b] flex items-center justify-center p-6 md:p-10 relative">
               <div className="absolute inset-0 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e71a7b32ad27e2da6198573b0.png')] opacity-10 mix-blend-overlay"></div>
               
               <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-black rounded-[3rem] border-[10px] border-[#1f2937] shadow-2xl overflow-hidden flex flex-col scale-[0.9] lg:scale-100">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1f2937] rounded-b-3xl z-30 flex items-center justify-center gap-2">
                    <div className="w-8 h-1 bg-black/40 rounded-full"></div>
                    <div className="w-2 h-2 bg-black/40 rounded-full"></div>
                  </div>

                  {/* WhatsApp Top Bar */}
                  <div className="h-20 bg-[#202c33] flex items-end pb-3 px-4 gap-3 z-20 border-b border-white/5">
                    <div className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center text-white text-lg border border-white/10 shadow-lg"><FaWhatsapp/></div>
                    <div className="flex-1">
                      <h5 className="text-white text-xs font-black truncate">Arena Repasse • Ofertas 🚀</h5>
                      <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest animate-pulse">Online agora</span>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 p-3 overflow-y-auto no-scrollbar space-y-4 bg-[rgba(11,20,26,0.5)]">
                     <div className="flex justify-center"><span className="bg-[#182229] text-[9px] text-gray-500 px-3 py-1 rounded-full uppercase font-black">Postagem de Venda</span></div>
                     
                     {/* BUBBLE */}
                     <div className="bg-[#005c4b] rounded-2xl rounded-tr-none p-1.5 shadow-xl ml-auto max-w-[95%] border border-white/5 animate-slide-up">
                        {/* Imagem */}
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-2 shadow-inner group">
                           <img src={selectedCar.image} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                           <div className="absolute bottom-2 left-2 flex gap-1">
                              <span className="bg-brand-orange text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase italic">Repasse</span>
                              <span className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase italic">Oportunidade</span>
                           </div>
                        </div>

                        {/* Texto */}
                        <div className="px-1.5 pb-1">
                          {generatedText ? (
                            <div className="text-[11px] text-white/90 whitespace-pre-line leading-relaxed font-sans">
                              {generatedText.split('\n').map((line, i) => {
                                // Renderização simples de negritos do WhatsApp no simulador
                                if (line.trim().startsWith('*') && line.trim().endsWith('*')) {
                                  return <strong key={i} className="text-white block">{line.replace(/\*/g, '')}</strong>;
                                }
                                return <span key={i} className="block">{line}</span>;
                              })}
                            </div>
                          ) : (
                            <div className="space-y-2 py-6">
                               <div className="h-2 bg-white/10 rounded w-3/4 animate-pulse"></div>
                               <div className="h-2 bg-white/10 rounded w-full animate-pulse delay-75"></div>
                               <div className="h-2 bg-white/10 rounded w-1/2 animate-pulse delay-150"></div>
                            </div>
                          )}
                          <div className="flex justify-end items-center gap-1 mt-1.5">
                             <span className="text-[9px] text-white/40">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             <div className="flex"><FaCheck size={8} className="text-blue-400"/><FaCheck size={8} className="text-blue-400 -ml-1"/></div>
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* Input Simulado */}
                  <div className="h-16 bg-[#202c33] flex items-center px-4 gap-3 border-t border-white/5">
                     <div className="flex-1 h-10 bg-[#2a3942] rounded-full flex items-center px-4"><span className="text-[10px] text-gray-500">Escreva uma mensagem...</span></div>
                     <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-xl transform active:scale-90 transition"><FaWhatsapp size={18}/></div>
                  </div>
               </div>

               {/* Legenda */}
               <div className="absolute bottom-8 flex flex-col items-center gap-2">
                 <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-full backdrop-blur-md">
                   <FaMobileAlt className="text-brand-orange animate-bounce" />
                   <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Preview em Tempo Real</span>
                 </div>
                 <p className="text-[9px] text-gray-600 text-center max-w-[200px]">A imagem e o texto serão enviados juntos para o contato selecionado.</p>
               </div>
            </div>

            <button onClick={() => setIsSalesModalOpen(false)} className="hidden lg:flex absolute top-8 right-8 p-3 text-white/30 hover:text-white transition bg-white/5 hover:bg-white/10 rounded-2xl">
               <FaTimes size={20}/>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
