
// DO NOT use @google/genai deprecated APIs. Always use the specified model names and initialization patterns.
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaPlus, FaFilter, FaMagic, FaCopy, FaWhatsapp, FaTimes, 
  FaCheck, FaBullhorn, FaPercentage, FaChevronLeft, FaChevronRight, FaImage,
  FaShoppingCart, FaUserTie, FaCalendarAlt, FaIdCard, FaMoneyBillWave,
  FaFileSignature, FaUserCheck
} from 'react-icons/fa';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Car, Seller } from '../../../types';
import { SectionHeader } from '../components/AdminUI';
import { encodeCarUrl } from '../../../utils/urlHelpers';
import { updateCar } from '../../../supabaseClient';

interface InventoryViewProps {
  cars: Car[];
  sellers: Seller[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onNew: () => void;
  onEdit: (car: Car) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (car: Car) => void;
  isAdmin: boolean;
  onRefresh: () => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  cars, sellers, searchTerm, setSearchTerm, onNew, onEdit, onDelete, onToggleStatus, isAdmin, onRefresh, showNotification
}) => {
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isSellConfirmationOpen, setIsSellConfirmationOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [benefits, setBenefits] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Form de Venda
  const [sellForm, setSellForm] = useState({
    soldBy: '',
    soldDate: new Date().toISOString().split('T')[0],
    soldPrice: '',
    customerName: '',
    customerCPF: ''
  });
  const [selling, setSelling] = useState(false);

  // Formatação de Documento (CPF/CNPJ)
  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      // CPF: 000.000.000-00
      return digits
        .replace(/(\.|\-)/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .substring(0, 14);
    } else {
      // CNPJ: 00.000.000/0001-00
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .substring(0, 18);
    }
  };

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
      // ALWAYS use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

      // Use ai.models.generateContent to query GenAI with both the model name and prompt.
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      // Directly access the extracted string via the .text property
      setGeneratedText((response.text || '').trim());
    } catch (error: any) {
      setGeneratedText(`Erro ao gerar: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || selling) return;
    
    setSelling(true);
    try {
      const { error } = await updateCar(selectedCar.id, {
        status: 'sold',
        soldBy: sellForm.soldBy,
        soldDate: sellForm.soldDate,
        soldPrice: Number(sellForm.soldPrice),
        customerName: sellForm.customerName,
        customerCPF: sellForm.customerCPF
      });

      if (error) throw new Error(error);

      showNotification('Venda registrada com sucesso!', 'success');
      setIsSellConfirmationOpen(false);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setSelling(false);
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
            <input type="text" placeholder="Buscar por modelo, marca ou placa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-brand-orange outline-none" />
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-center">Status</th>
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
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      c.status === 'available' ? 'bg-green-500/10 text-green-500' :
                      c.status === 'sold' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {c.status === 'available' ? 'Disponível' : c.status === 'sold' ? 'Vendido' : 'Manutenção'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       {c.status === 'available' && (
                         <button 
                           onClick={() => { setSelectedCar(c); setSellForm({...sellForm, soldPrice: String(c.price)}); setIsSellConfirmationOpen(true); }}
                           className="p-3 text-green-400 bg-green-500/10 hover:bg-green-600 hover:text-white rounded-xl transition shadow-sm"
                           title="Registrar Venda"
                         >
                           <FaShoppingCart/>
                         </button>
                       )}
                       <button 
                         onClick={() => { setSelectedCar(c); setSelectedImageIndex(0); setGeneratedText(''); setBenefits(''); setIsSalesModalOpen(true); }} 
                         className="p-3 text-purple-400 bg-purple-500/10 hover:bg-purple-600 hover:text-white rounded-xl transition shadow-sm"
                         title="Gerar Post Turbo"
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

      {/* MODAL TURBO POST IA */}
      {isSalesModalOpen && selectedCar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsSalesModalOpen(false)}></div>
          <div className="relative bg-brand-surface w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
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
                      <button onClick={copyToClipboard} className={`py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all ${copyFeedback ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                        {copyFeedback ? <FaCheck/> : <FaCopy/>} {copyFeedback ? 'Copiado!' : 'Copiar Texto'}
                      </button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generatedText)}`, '_blank')} className="py-4 bg-[#25D366] hover:bg-[#1dbf57] text-white font-black uppercase text-xs flex items-center justify-center gap-2 rounded-xl transition shadow-lg">
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

      {/* MODAL DE REGISTRO DE VENDA - DESIGN PREMIUM */}
      {isSellConfirmationOpen && selectedCar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsSellConfirmationOpen(false)}></div>
          <div className="relative bg-[#0d0d0d] w-full max-w-2xl rounded-[2.5rem] border border-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up">
            
            {/* Header com Gradiente */}
            <div className="bg-gradient-to-r from-[#DC2626] to-[#7f1d1d] p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
               <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                      <FaShoppingCart className="animate-bounce" /> Registro de Venda
                    </h3>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Conclua a transação do veículo</p>
                  </div>
                  <button onClick={() => setIsSellConfirmationOpen(false)} className="bg-black/20 hover:bg-black/40 text-white p-3 rounded-2xl transition backdrop-blur-sm">
                    <FaTimes size={18}/>
                  </button>
               </div>
            </div>

            <form onSubmit={handleConfirmSell} className="p-8 space-y-8">
              
              {/* Card do Veículo */}
              <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[1.5rem] border border-white/10 group">
                <div className="relative">
                  <img src={selectedCar.image} className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-orange group-hover:scale-105 transition-transform" alt="Carro" />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg border-2 border-[#0d0d0d]">
                    <FaCheck size={10}/>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-black text-white leading-tight uppercase italic">{selectedCar.model}</h4>
                  <p className="text-xs text-brand-orange font-black uppercase tracking-[0.2em] mt-1">{selectedCar.make} • {selectedCar.year}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="bg-white/10 text-gray-300 text-[9px] font-black uppercase px-2 py-1 rounded-md border border-white/5">FIPE: {formatCurrency(selectedCar.fipeprice)}</span>
                    <span className="bg-brand-orange/20 text-brand-orange text-[9px] font-black uppercase px-2 py-1 rounded-md border border-brand-orange/10">Repasse: {formatCurrency(selectedCar.price)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Seção Dados do Fechamento */}
                <div className="space-y-4 md:col-span-2">
                   <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4 flex items-center gap-2">
                     <FaFileSignature className="text-brand-orange"/> Informações do Fechamento
                   </h5>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                          <FaUserTie className="text-brand-orange"/> Consultor de Vendas
                        </label>
                        <select 
                          required
                          className="w-full bg-black/40 border border-gray-700 rounded-2xl p-3.5 text-sm text-white focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                          value={sellForm.soldBy}
                          onChange={e => setSellForm({...sellForm, soldBy: e.target.value})}
                        >
                          <option value="" className="bg-[#0d0d0d]">Selecionar Consultor...</option>
                          {sellers.map(s => <option key={s.id} value={s.name} className="bg-[#0d0d0d]">{s.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                          <FaCalendarAlt className="text-brand-orange"/> Data da Venda
                        </label>
                        <input 
                          type="date"
                          required
                          className="w-full bg-black/40 border border-gray-700 rounded-2xl p-3 text-sm text-white focus:border-brand-orange outline-none"
                          value={sellForm.soldDate}
                          onChange={e => setSellForm({...sellForm, soldDate: e.target.value})}
                        />
                      </div>
                   </div>
                </div>

                {/* Seção Financeira */}
                <div className="space-y-4 md:col-span-2">
                  <div className="bg-brand-orange/5 border border-brand-orange/10 p-6 rounded-[1.5rem] relative overflow-hidden group">
                     <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                       <FaMoneyBillWave size={80} className="text-brand-orange"/>
                     </div>
                     <label className="text-[10px] font-black text-brand-orange uppercase tracking-widest block mb-2">Valor Real de Venda</label>
                     <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-orange font-black text-2xl">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          className="w-full bg-transparent border-b-2 border-brand-orange/30 p-4 pl-10 text-4xl font-black text-white focus:border-brand-orange outline-none transition-all placeholder:text-white/10"
                          placeholder="0,00"
                          value={sellForm.soldPrice}
                          onChange={e => setSellForm({...sellForm, soldPrice: e.target.value})}
                        />
                     </div>
                  </div>
                </div>

                {/* Seção Dados do Cliente */}
                <div className="space-y-4 md:col-span-2 pt-4">
                   <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4 flex items-center gap-2">
                     <FaUserCheck className="text-brand-orange"/> Identificação do Cliente
                   </h5>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome Completo / Razão Social</label>
                        <div className="relative">
                           <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"/>
                           <input 
                            type="text"
                            required
                            placeholder="Nome do Comprador"
                            className="w-full bg-black/40 border border-gray-700 rounded-2xl p-3.5 pl-11 text-sm text-white focus:border-brand-orange outline-none"
                            value={sellForm.customerName}
                            onChange={e => setSellForm({...sellForm, customerName: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Documento (CPF ou CNPJ)</label>
                        <div className="relative">
                           <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"/>
                           <input 
                            type="text"
                            required
                            placeholder="000.000.000-00"
                            className="w-full bg-black/40 border border-gray-700 rounded-2xl p-3.5 pl-11 text-sm text-white focus:border-brand-orange outline-none"
                            value={sellForm.customerCPF}
                            onChange={e => setSellForm({...sellForm, customerCPF: formatDocument(e.target.value)})}
                          />
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Ação Principal */}
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={selling}
                  className="w-full py-5 bg-gradient-to-r from-brand-orange to-red-600 hover:from-red-600 hover:to-brand-orange text-white font-black uppercase tracking-widest rounded-3xl shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 italic text-lg"
                >
                  {selling ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><FaCheck className="text-xl"/> Finalizar e Publicar Venda</>
                  )}
                </button>
                <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest mt-4">Ao confirmar, o veículo será marcado como "Vendido" publicamente no site.</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
