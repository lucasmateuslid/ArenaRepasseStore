import React, { useState } from 'react';
import { FaPlus, FaFilter, FaTrash, FaBan, FaMagic, FaCopy, FaWhatsapp, FaTimes, FaCheck, FaEdit, FaMobileAlt, FaImage, FaCalculator, FaShareAlt } from 'react-icons/fa';
import { GoogleGenAI } from "@google/genai";
import { Car } from '../../../types';
import { SectionHeader } from '../components/AdminUI';

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

  const handleGenerateText = async () => {
    if (!selectedCar) return;
    setIsGenerating(true);

    try {
      const env = (typeof process !== 'undefined' && process.env) ? process.env : (window as any).process?.env;
      const apiKey = env?.API_KEY;
      
      if (!apiKey) throw new Error('Gemini API Key não configurada no ambiente.');

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Crie um anúncio de repasse para WhatsApp para o carro ${selectedCar.make} ${selectedCar.model}. Preço: R$ ${selectedCar.price}. FIPE: R$ ${selectedCar.fipeprice}. Diferenciais: ${benefits}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setGeneratedText((response.text || '').trim());
    } catch (error: any) {
      console.error(error);
      setGeneratedText(`Erro: ${error.message || 'Falha na conexão com IA'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const shareToWhatsApp = async () => {
    if (!selectedCar || !generatedText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(generatedText)}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0 relative">
      <SectionHeader 
        title="Estoque Arena" 
        subtitle="Gerenciamento de frota e inteligência de vendas"
        action={isAdmin && (
          <button onClick={onNew} className="bg-brand-orange hover:bg-brand-orangeHover text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow">
            <FaPlus /> Novo Veículo
          </button>
        )}
      />

      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 bg-black/20">
          <div className="relative max-w-md">
            <input type="text" placeholder="Pesquisar estoque..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-brand-orange outline-none" />
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
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
                    <img src={c.image} className="w-12 h-12 rounded-lg object-cover bg-gray-900 border border-gray-800" />
                    <div>
                      <span className="font-bold text-white block">{c.model}</span>
                      <span className="text-xs text-brand-orange font-medium">{c.make}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(c.status || 'available')}</td>
                  <td className="px-6 py-4 font-bold text-white">{formatCurrency(c.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => { setSelectedCar(c); setIsSalesModalOpen(true); }} className="p-2 text-purple-400 bg-purple-500/10 hover:bg-purple-600 hover:text-white rounded-lg transition"><FaMagic/></button>
                       <button onClick={() => onEdit(c)} className="px-3 py-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500 hover:text-white rounded-lg transition text-xs font-bold uppercase">Gerenciar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isSalesModalOpen && selectedCar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsSalesModalOpen(false)}></div>
          <div className="relative bg-brand-surface w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden p-6 md:p-10">
            <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6"><FaMagic className="text-brand-orange"/> Gerador de Anúncio IA</h3>
            <textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} className="w-full h-24 bg-black/40 border border-gray-700 rounded-xl p-4 text-sm text-white focus:border-brand-orange outline-none mb-4" placeholder="Destaques (Ex: Pneus novos, revisado...)"></textarea>
            {generatedText && <div className="bg-black/40 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 mb-6 whitespace-pre-line max-h-48 overflow-y-auto">{generatedText}</div>}
            <div className="flex gap-3">
              <button onClick={handleGenerateText} disabled={isGenerating} className="flex-1 py-4 bg-brand-orange text-white font-bold rounded-xl disabled:opacity-50">{isGenerating ? 'Gerando...' : 'Gerar Texto'}</button>
              {generatedText && <button onClick={copyToClipboard} className="px-6 bg-gray-800 text-white rounded-xl"><FaCopy/></button>}
              {generatedText && <button onClick={shareToWhatsApp} className="px-6 bg-green-600 text-white rounded-xl"><FaWhatsapp/></button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};