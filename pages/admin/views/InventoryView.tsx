import React, { useState } from 'react';
import { FaPlus, FaFilter, FaTrash, FaBan, FaMagic, FaCopy, FaWhatsapp, FaTimes, FaCheck } from 'react-icons/fa';
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
  // --- STATES PARA O GERADOR DE VENDAS ---
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
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
    setBenefits("Lacrado\nRevisado na agência\nManual e chave cópia\nIPVA Pago\nSem detalhes"); // Default suggestion
    setGeneratedText('');
    setIsSalesModalOpen(true);
  };

  const handleGenerateText = async () => {
    if (!selectedCar) return;
    setIsGenerating(true);

    try {
      const apiKey = getEnv('VITE_GOOGLE_API_KEY');
      if (!apiKey) throw new Error('API Key não configurada');

      const ai = new GoogleGenAI({ apiKey });
      
      const displayYearVal = selectedCar.year === 32000 ? 'Zero KM' : selectedCar.year;
      const fipeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCar.fipeprice || 0);
      const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCar.price || 0);
      const kmFormatted = selectedCar.mileage.toLocaleString('pt-BR');

      const prompt = `
        Atue como um vendedor de carros experiente. Crie um texto de venda curto, direto e formatado para grupos de WhatsApp (estilo lista).
        
        DADOS DO VEÍCULO:
        Modelo: ${selectedCar.make} ${selectedCar.model}
        Ano: ${displayYearVal}
        KM: ${kmFormatted}
        Preço FIPE: ${fipeFormatted}
        Preço Venda: ${priceFormatted}

        DIFERENCIAIS INFORMADOS:
        ${benefits}

        FORMATO OBRIGATÓRIO DE SAÍDA (Não coloque introdução, apenas o texto):
        [MODELO EM MAIÚSCULO]
        [ANO] [KM]km

        [Lista de diferenciais, um por linha]

        Fipe [Valor Fipe]
        Por [Valor Venda]

        (Não use asteriscos ** para negrito, o WhatsApp usa *, mas prefira texto limpo. Não adicione emojis excessivos).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      setGeneratedText(response.text.trim());

    } catch (error) {
      console.error(error);
      setGeneratedText("Erro ao gerar texto. Verifique a chave de API ou tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0 relative">
      <SectionHeader 
        title="Controle de Frota" 
        subtitle="Gerencie disponibilidade, vendas e manutenções"
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
              placeholder="Buscar por nome, placa, status..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-black/40 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-brand-orange outline-none" 
            />
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Mobile View: Cards */}
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
                <div className="text-xs text-gray-500 mb-1 space-y-0.5">
                  <p>{displayYear(c.year)} • {c.category}</p>
                  <p className="font-mono text-[10px] text-gray-600">Placa: {c.licensePlate || '-'}</p>
                </div>
                <p className="text-brand-orange font-bold text-sm mb-2">R$ {c.price.toLocaleString('pt-BR')}</p>
                
                <div className="flex gap-2">
                   {/* Botão Mágico Mobile */}
                   <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openSalesModal(c); }}
                      className="px-3 py-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 rounded-lg transition"
                      title="Gerar Anúncio IA"
                   >
                      <FaMagic />
                   </button>

                   {isAdmin && (
                    <>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-xs font-medium border border-gray-700"
                      >
                        Gerenciar
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} 
                        className="px-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded border border-red-500/30 transition flex items-center justify-center"
                      >
                        <FaTrash size={12}/>
                      </button>
                    </>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Financeiro</th>
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
                      <span className="text-xs text-brand-orange">{c.make} • {displayYear(c.year)}</span>
                      <span className="text-[10px] text-gray-500 block font-mono mt-0.5">Placa: {c.licensePlate || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(c.status || 'available')}
                    {c.status === 'maintenance' && <p className="text-[10px] text-gray-500 mt-1 max-w-[150px] truncate">{c.maintenanceReason}</p>}
                    {c.status === 'sold' && <p className="text-[10px] text-gray-500 mt-1">Vend: {c.soldBy}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">R$ {c.price.toLocaleString('pt-BR')}</p>
                    {c.status === 'sold' && (
                      <p className={`text-[10px] mt-1 ${isAdmin ? 'text-green-500' : 'text-gray-600'}`}>
                        Vendido: {isAdmin ? `R$ ${Number(c.soldPrice).toLocaleString('pt-BR')}` : '****'}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition">
                       {/* Botão Mágico Desktop */}
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); openSalesModal(c); }} 
                         className="p-2 text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-600 rounded-lg transition" 
                         title="Gerar Texto de Venda (IA)"
                       >
                         <FaMagic/>
                       </button>

                       {isAdmin && (
                         <>
                           <button 
                             type="button"
                             onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                             className="px-3 py-1.5 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition text-xs font-bold" 
                             title="Editar"
                           >
                             GERENCIAR
                           </button>
                           <button 
                             type="button"
                             onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} 
                             className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition" 
                             title="Excluir"
                           >
                             <FaTrash/>
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL GERADOR DE MENSAGEM --- */}
      {isSalesModalOpen && selectedCar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSalesModalOpen(false)}></div>
          <div className="relative bg-brand-surface w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-brand-darkRed p-4 flex items-center justify-between border-b border-gray-700">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FaMagic className="text-brand-orange"/> Gerador de Anúncio IA
              </h3>
              <button onClick={() => setIsSalesModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              <div className="bg-black/20 p-3 rounded-lg border border-gray-700/50">
                 <h4 className="text-sm font-bold text-white mb-1">{selectedCar.make} {selectedCar.model}</h4>
                 <p className="text-xs text-gray-400">
                   {displayYear(selectedCar.year)} • {selectedCar.mileage.toLocaleString()}km • <span className="text-brand-orange font-bold">R$ {selectedCar.price.toLocaleString('pt-BR')}</span>
                 </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Diferenciais / Opcionais (um por linha)</label>
                <textarea 
                  value={benefits} 
                  onChange={(e) => setBenefits(e.target.value)}
                  className="w-full h-24 bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none resize-none"
                  placeholder="Ex: Teto solar, Único dono..."
                ></textarea>
              </div>

              {!generatedText ? (
                <button 
                  onClick={handleGenerateText} 
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> Criando Mágica...</> : <><FaMagic/> Gerar Texto</>}
                </button>
              ) : (
                <div className="animate-fade-in space-y-4">
                   <div className="relative">
                     <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Texto Gerado</label>
                     <textarea 
                       value={generatedText} 
                       onChange={(e) => setGeneratedText(e.target.value)}
                       className="w-full h-40 bg-gray-900 border border-green-500/30 rounded-lg p-3 text-sm text-white focus:border-green-500 outline-none resize-none font-mono leading-relaxed"
                     ></textarea>
                   </div>
                   
                   <div className="flex gap-2">
                      <button 
                        onClick={copyToClipboard} 
                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        {copyFeedback ? <><FaCheck className="text-green-400"/> Copiado</> : <><FaCopy/> Copiar</>}
                      </button>
                      <button 
                        onClick={handleGenerateText} 
                        className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition"
                        title="Gerar Novamente"
                      >
                        <FaMagic />
                      </button>
                   </div>

                   <button 
                     onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generatedText)}`, '_blank')}
                     className="w-full py-3 bg-[#25D366] hover:brightness-110 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                   >
                     <FaWhatsapp className="text-xl"/> Enviar no WhatsApp
                   </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};