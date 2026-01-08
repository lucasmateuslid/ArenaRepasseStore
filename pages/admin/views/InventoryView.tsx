
import React, { useState, useMemo } from 'react';
import { 
  FaPlus, FaFilter, FaMagic, FaCopy, FaWhatsapp, FaTimes, 
  FaCheck, FaBullhorn, FaPercentage, FaChevronLeft, FaChevronRight, FaImage
} from 'react-icons/fa';
import { GoogleGenAI } from "@google/genai";
import { Car } from '../../../types';
import { SectionHeader } from '../components/AdminUI';
import { encodeCarUrl } from '../../../utils/urlHelpers';

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [benefits, setBenefits] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const filteredCars = cars.filter((c: Car) => 
    c.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status?.includes(searchTerm.toLowerCase()) ||
    c.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const carImages = useMemo(() => {
    if (!selectedCar) return [];
    return [selectedCar.image, ...(selectedCar.gallery || [])].filter(img => !!img);
  }, [selectedCar]);

  const financial = useMemo(() => {
    if (!selectedCar) return { fipe: 0, price: 0, discount: 0, pct: 0 };
    const fipe = Number(selectedCar.fipeprice) || 0;
    const price = Number(selectedCar.price) || 0;
    const discount = fipe - price;
    const pct = fipe > 0 ? Math.round((discount / fipe) * 100) : 0;
    return { fipe, price, discount, pct };
  }, [selectedCar]);

  const handleGenerateText = async () => {
    if (!selectedCar) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY || '' });
      const shareUrl = `${window.location.origin}/#/?v=${encodeCarUrl(selectedCar.id, selectedCar.make, selectedCar.model, selectedCar.year)}`;
      
      const prompt = `
        Atue como um Copywriter sênior de vendas. Crie um anúncio de ALTO IMPACTO para WhatsApp.
        Use emojis e negritos (*) para destacar.
        
        DADOS:
        - Veículo: ${selectedCar.make} ${selectedCar.model}
        - Ano: ${selectedCar.year === 32000 ? 'Zero KM' : selectedCar.year}
        - KM: ${selectedCar.mileage.toLocaleString()} km
        - Diferenciais: ${benefits || 'Excelente estado, revisado e com garantia.'}
        - Fipe: R$ ${financial.fipe.toLocaleString('pt-BR')}
        - Preço Repasse: R$ ${financial.price.toLocaleString('pt-BR')}
        - Economia: R$ ${financial.discount.toLocaleString('pt-BR')} (${financial.pct}% OFF)
        - Link: ${shareUrl}

        Estrutura:
        1. Headline chamativa.
        2. Ficha técnica rápida.
        3. Destaque do Preço vs Fipe com emojis de urgência.
        4. CTA com o link.
        
        Responda APENAS o texto pronto.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setGeneratedText((response.text || '').trim());
    } catch (error: any) {
      setGeneratedText(`Erro ao gerar: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader 
        title="Gestão de Estoque" 
        subtitle="Controle e inteligência de vendas Arena Repasse"
        action={isAdmin && (
          <button onClick={onNew} className="bg-brand-orange hover:bg-brand-orangeHover text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow transition-all">
            <FaPlus /> Adicionar Veículo
          </button>
        )}
      />

      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-black/20 border-b border-gray-800 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <input type="text" placeholder="Buscar veículo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-brand-orange outline-none" />
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {filteredCars.map((c: Car) => (
                <tr key={c.id} className="hover:bg-white/5 transition group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <img src={c.image} className="w-12 h-12 rounded-lg object-cover bg-gray-900 border border-gray-800" />
                    <div>
                      <span className="font-bold text-white block">{c.model}</span>
                      <span className="text-[10px] text-brand-orange font-bold uppercase">{c.make} • {c.year}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-white">{formatCurrency(c.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => { setSelectedCar(c); setSelectedImageIndex(0); setGeneratedText(''); setBenefits(''); setIsSalesModalOpen(true); }} 
                         className="p-3 text-purple-400 bg-purple-500/10 hover:bg-purple-600 hover:text-white rounded-xl transition shadow-sm"
                       >
                         <FaMagic/>
                       </button>
                       <button onClick={() => onEdit(c)} className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500 hover:text-white rounded-xl transition text-[10px] font-black uppercase border border-blue-500/20">Editar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isSalesModalOpen && selectedCar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsSalesModalOpen(false)}></div>
          <div className="relative bg-brand-surface w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
            
            {/* Lado Esquerdo: Seletor de Mídia */}
            <div className="w-full lg:w-96 bg-black/40 border-r border-gray-800 p-8 flex flex-col gap-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mídia da Postagem</p>
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-brand-orange shadow-lg">
                  <img src={carImages[selectedImageIndex]} className="w-full h-full object-cover" alt="Preview" />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                   {carImages.map((img, idx) => (
                     <button key={idx} onClick={() => setSelectedImageIndex(idx)} className={`w-14 h-14 rounded-lg flex-shrink-0 border-2 transition-all ${selectedImageIndex === idx ? 'border-brand-orange scale-105 opacity-100' : 'border-transparent opacity-40 hover:opacity-70'}`}>
                        <img src={img} className="w-full h-full object-cover rounded-md" />
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-800">
                 <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Preço Repasse</span>
                    <span className="text-xl font-black text-white">{formatCurrency(financial.price)}</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Economia Real</span>
                    <span className="text-lg font-black text-green-500">-{financial.pct}% FIPE</span>
                 </div>
              </div>

              <button onClick={() => setIsSalesModalOpen(false)} className="mt-auto text-[10px] text-gray-500 hover:text-white transition uppercase font-black py-4 border-t border-gray-800">Fechar</button>
            </div>

            {/* Lado Direito: IA e Preview WhatsApp */}
            <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-brand-surface">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
                  <FaMagic className="text-brand-orange animate-pulse"/> Turbo Post IA
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Informações Adicionais</label>
                  <textarea 
                    value={benefits} 
                    onChange={(e) => setBenefits(e.target.value)} 
                    className="w-full h-24 bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm text-white focus:border-brand-orange outline-none resize-none" 
                    placeholder="Ex: Pneus novos, revisões na concessionária, única dona..."
                  />
                </div>

                {!generatedText ? (
                  <button 
                    onClick={handleGenerateText} 
                    disabled={isGenerating} 
                    className="w-full py-5 bg-gradient-to-r from-brand-orange to-red-600 text-white font-black uppercase rounded-2xl shadow-glow disabled:opacity-50 flex items-center justify-center gap-3 transition transform active:scale-95"
                  >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FaBullhorn/> Gerar Anúncio de Venda</>}
                  </button>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest px-2">Visualização no WhatsApp</p>
                    
                    <div className="relative bg-[#0b141a] rounded-2xl p-5 text-sm text-[#e9edef] border border-white/5 shadow-2xl font-sans leading-relaxed">
                      <div className="whitespace-pre-line">{generatedText}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={copyToClipboard}
                        className={`py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all ${copyFeedback ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                      >
                        {copyFeedback ? <FaCheck/> : <FaCopy/>} {copyFeedback ? 'Copiado!' : 'Copiar Texto'}
                      </button>
                      <button 
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generatedText)}`, '_blank')}
                        className="py-4 bg-[#25D366] hover:bg-[#1dbf57] text-white font-black uppercase text-xs flex items-center justify-center gap-2 rounded-xl transition shadow-lg"
                      >
                        <FaWhatsapp size={16}/> Enviar WhatsApp
                      </button>
                    </div>
                    <button onClick={() => setGeneratedText('')} className="w-full text-[10px] text-gray-500 uppercase font-bold hover:text-white">Refazer Texto</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
