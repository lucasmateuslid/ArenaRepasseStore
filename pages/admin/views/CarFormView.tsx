
import React, { useState, useMemo } from 'react';
import { 
  FaTimes, FaCamera, FaPlus, FaSave, FaChevronRight, FaSearchDollar, 
  FaTruck, FaMotorcycle, FaCar, FaMapMarkerAlt, FaTrash, FaTools, FaMoneyBillWave, FaChartLine
} from 'react-icons/fa';
import { Car, Seller, CarExpense } from '../../../types';

interface CarFormViewProps {
  carFormData: Partial<Car>;
  setCarFormData: React.Dispatch<React.SetStateAction<Partial<Car>>>;
  mainImagePreview: string | null;
  setMainImagePreview: (url: string | null) => void;
  galleryFiles: File[];
  setGalleryFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setMainImageFile: (file: File | null) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  vehicleType: string;
  setVehicleType: (type: string) => void;
  fipeBrands: any[];
  fipeModels: any[];
  fipeYears: any[];
  onFipeBrand: (codigo: string) => void;
  onFipeModel: (codigo: string) => void;
  onFipeYear: (codigo: string) => void;
  loadingFipe: boolean;
  onGetLocation: () => void;
  sellers: Seller[];
}

export const CarFormView: React.FC<CarFormViewProps> = ({
  carFormData, setCarFormData, mainImagePreview, setMainImagePreview,
  galleryFiles, setGalleryFiles, setMainImageFile, onSave, onCancel, saving,
  vehicleType, setVehicleType, fipeBrands, fipeModels, fipeYears, 
  onFipeBrand, onFipeModel, onFipeYear, loadingFipe, onGetLocation, sellers
}) => {
  const currentStatus = carFormData.status || 'available';
  const [activeTab, setActiveTab] = useState<'details' | 'financial'>('details');

  // Estado para nova despesa
  const [newExpense, setNewExpense] = useState<Partial<CarExpense>>({
    description: '',
    amount: 0,
    type: 'maintenance',
    date: new Date().toISOString().split('T')[0]
  });

  // --- LÓGICA FINANCEIRA ---
  const financialSummary = useMemo(() => {
    const purchasePrice = Number(carFormData.purchasePrice) || 0;
    const currentPrice = Number(carFormData.price) || 0;
    const soldPrice = Number(carFormData.soldPrice) || 0;
    
    // Total de Despesas
    const totalExpenses = (carFormData.expenses || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
    // Custo Total
    const totalCost = purchasePrice + totalExpenses;

    // Valor de Referência para Lucro (Se vendido, usa soldPrice. Se não, usa o preço de anúncio projetado)
    const referenceRevenue = currentStatus === 'sold' ? soldPrice : currentPrice;

    // Lucro/Prejuízo
    const profit = referenceRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return { purchasePrice, totalExpenses, totalCost, profit, roi, referenceRevenue };
  }, [carFormData.purchasePrice, carFormData.price, carFormData.soldPrice, carFormData.expenses, currentStatus]);

  // --- HANDLERS ---
  
  // Remover foto já salva (URL)
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const currentGallery = carFormData.gallery || [];
    const newGallery = currentGallery.filter((_, idx) => idx !== indexToRemove);
    setCarFormData({ ...carFormData, gallery: newGallery });
  };

  // Remover foto nova (File) que ainda será enviada
  const handleRemoveNewGalleryFile = (indexToRemove: number) => {
    setGalleryFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;

    const expense: CarExpense = {
      id: crypto.randomUUID(),
      description: newExpense.description!,
      amount: Number(newExpense.amount),
      date: newExpense.date || new Date().toISOString(),
      type: newExpense.type as any || 'other'
    };

    const currentExpenses = carFormData.expenses || [];
    setCarFormData({ ...carFormData, expenses: [...currentExpenses, expense] });
    
    // Reset form
    setNewExpense({ description: '', amount: 0, type: 'maintenance', date: new Date().toISOString().split('T')[0] });
  };

  const handleRemoveExpense = (id: string) => {
    const currentExpenses = carFormData.expenses || [];
    setCarFormData({ ...carFormData, expenses: currentExpenses.filter(e => e.id !== id) });
  };

  return (
  <div className="max-w-6xl mx-auto pb-24 md:pb-0 animate-slide-up">
    
    {/* Header & Tabs */}
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <h2 className="text-2xl font-black text-white">{carFormData.id ? 'Gerenciar Veículo' : 'Novo Cadastro'}</h2>
      
      <div className="flex bg-black/30 p-1 rounded-xl">
        <button 
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'details' ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <FaCar className="inline mr-2"/> Detalhes & Fotos
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'financial' ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <FaChartLine className="inline mr-2"/> Financeiro & Histórico
        </button>
      </div>

      <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center"><FaTimes/></button>
    </div>

    <form onSubmit={onSave} className="space-y-6">
      
      {/* --- ABA DETALHES --- */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Imagens e Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-brand-surface border border-gray-800 rounded-2xl p-5">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Status do Veículo</label>
              <select 
                className={`w-full p-3 rounded-xl border font-bold text-sm outline-none appearance-none ${
                  currentStatus === 'available' ? 'bg-blue-500/10 border-blue-500 text-blue-500' :
                  currentStatus === 'sold' ? 'bg-green-500/10 border-green-500 text-green-500' :
                  currentStatus === 'maintenance' ? 'bg-orange-500/10 border-orange-500 text-orange-500' :
                  'bg-gray-800 border-gray-600 text-gray-400'
                }`}
                value={currentStatus}
                onChange={e => setCarFormData({...carFormData, status: e.target.value as any})}
              >
                <option value="available">Disponível para Venda</option>
                <option value="sold">Vendido</option>
                <option value="maintenance">Em Manutenção</option>
                <option value="unavailable">Indisponível / Outros</option>
              </select>

              {/* Campos Condicionais de Status */}
              {currentStatus === 'maintenance' && (
                <div className="mt-4 animate-fade-in">
                  <label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">Motivo da Manutenção</label>
                  <input type="text" required className="w-full bg-black/30 border border-orange-500/30 rounded-lg p-2 text-sm text-white" placeholder="Ex: Troca de óleo e pneus" value={carFormData.maintenanceReason || ''} onChange={e => setCarFormData({...carFormData, maintenanceReason: e.target.value})} />
                </div>
              )}

              {currentStatus === 'sold' && (
                <div className="mt-4 space-y-3 animate-fade-in bg-green-500/5 p-3 rounded-xl border border-green-500/20">
                  <div>
                      <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Valor Final de Venda (R$)</label>
                      <input type="number" step="0.01" required className="w-full bg-black/30 border border-green-500/30 rounded-lg p-2 text-sm text-white focus:border-green-500 outline-none" placeholder="0.00" value={carFormData.soldPrice || ''} onChange={e => setCarFormData({...carFormData, soldPrice: Number(e.target.value)})} />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Data da Venda</label>
                      <input type="date" required className="w-full bg-black/30 border border-green-500/30 rounded-lg p-2 text-sm text-white focus:border-green-500 outline-none" value={carFormData.soldDate || new Date().toISOString().split('T')[0]} onChange={e => setCarFormData({...carFormData, soldDate: e.target.value})} />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Consultor Responsável</label>
                      <select required className="w-full bg-black/30 border border-green-500/30 rounded-lg p-2 text-sm text-white focus:border-green-500 outline-none" value={carFormData.soldBy || ''} onChange={e => setCarFormData({...carFormData, soldBy: e.target.value})}>
                        <option value="">Selecione...</option>
                        {sellers.map((s: Seller) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-brand-surface border border-gray-800 rounded-2xl p-5">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Mídia e Galeria</label>
              
              {/* Foto Principal */}
              <div className="relative aspect-video bg-black/50 rounded-xl border-2 border-dashed border-gray-700 hover:border-brand-orange group cursor-pointer overflow-hidden transition-colors mb-4">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={e => { if(e.target.files?.[0]) { setMainImageFile(e.target.files[0]); setMainImagePreview(URL.createObjectURL(e.target.files[0])); } }} accept="image/*" />
                {mainImagePreview ? (
                  <img src={mainImagePreview} className="w-full h-full object-cover group-hover:opacity-60 transition" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <FaCamera className="text-3xl mb-2"/>
                    <span className="text-[10px] uppercase font-bold">Capa</span>
                  </div>
                )}
              </div>

              {/* Botão Adicionar Fotos */}
              <div className="relative h-12 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-white cursor-pointer hover:bg-gray-700 transition border border-gray-700 mb-4">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])])} accept="image/*" />
                  <span className="text-xs font-bold flex items-center gap-2"><FaPlus/> Adicionar Fotos</span>
              </div>

              {/* Grid de Galeria (Existente + Novas) */}
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                {/* Fotos Salvas (Com botão de excluir) */}
                {carFormData.gallery?.map((imgUrl, idx) => (
                  <div key={`old-${idx}`} className="relative aspect-square group">
                    <img src={imgUrl} className="w-full h-full object-cover rounded-lg border border-gray-700" alt={`thumb-${idx}`}/>
                    <button 
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg hover:scale-110 transition z-10"
                      title="Remover foto"
                    >
                      <FaTimes/>
                    </button>
                  </div>
                ))}
                
                {/* Fotos Novas (Preview com botão de excluir) */}
                {galleryFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square group">
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-lg border border-green-500/50" alt={`new-${idx}`}/>
                    <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none opacity-50"></div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveNewGalleryFile(idx)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg hover:scale-110 transition z-10"
                      title="Cancelar upload"
                    >
                      <FaTimes/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna 2 e 3: Dados Gerais */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
              
              {/* Integração FIPE */}
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs"><FaSearchDollar/></span>
                    <div>
                      <h4 className="text-sm font-bold text-blue-100">Ficha Técnica FIPE</h4>
                      <p className="text-[10px] text-blue-300">Selecione para preencher automaticamente</p>
                    </div>
                    <div className="ml-auto flex bg-black/30 rounded-lg p-1">
                      {['carros', 'motos', 'caminhoes'].map(t => (
                        <button type="button" key={t} onClick={() => setVehicleType(t)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${vehicleType === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                          {t === 'caminhoes' ? <FaTruck/> : t === 'motos' ? <FaMotorcycle/> : <FaCar/>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select 
                        className="w-full bg-gray-900 border border-blue-500/30 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        onChange={e => onFipeBrand(e.target.value)}
                      >
                        <option value="" className="bg-gray-900 text-gray-400">1. Marca</option>
                        {fipeBrands.map((b) => <option key={b.codigo} value={b.codigo} className="bg-gray-900 text-white">{b.nome}</option>)}
                      </select>
                    
                    <select 
                        className="w-full bg-gray-900 border border-blue-500/30 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50" 
                        onChange={e => onFipeModel(e.target.value)} 
                        disabled={fipeModels.length === 0}
                    >
                        <option value="" className="bg-gray-900 text-gray-400">2. Modelo</option>
                        {fipeModels.map((m) => <option key={m.codigo} value={m.codigo} className="bg-gray-900 text-white">{m.nome}</option>)}
                    </select>
                    
                    <select 
                        className="w-full bg-gray-900 border border-blue-500/30 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50" 
                        onChange={e => onFipeYear(e.target.value)} 
                        disabled={fipeYears.length === 0}
                    >
                        <option value="" className="bg-gray-900 text-gray-400">3. Ano</option>
                        {fipeYears.map((y) => <option key={y.codigo} value={y.codigo} className="bg-gray-900 text-white">{y.nome}</option>)}
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[ 
                    { label: 'Marca', key: 'make', type: 'text' }, 
                    { label: 'Modelo', key: 'model', type: 'text' }, 
                    { label: 'Placa', key: 'licensePlate', type: 'text', placeholder: 'ABC-1234' },
                    { label: 'Ano', key: 'year', type: 'number', hint: '(32000 = Zero KM)' }, 
                    { label: 'Categoria', key: 'category', type: 'select', opts: ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Moto', 'Caminhão', 'Van'] }, 
                    { label: 'KM', key: 'mileage', type: 'number' }, 
                    { label: 'Combustível', key: 'fuel', type: 'select', opts: ['Flex','Gasolina','Diesel','Elétrico','Híbrido'] }, 
                    { label: 'Câmbio', key: 'transmission', type: 'select', opts: ['Manual','Automático','CVT'] }, 
                    { label: 'Cidade', key: 'location', type: 'text', icon: <FaMapMarkerAlt onClick={onGetLocation} className="cursor-pointer text-brand-orange hover:scale-110 transition"/> } 
                  ].map((field: any) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        {field.label} {field.hint && <span className="text-gray-600 normal-case ml-1">{field.hint}</span>}
                      </label>
                      <div className="relative">
                        {field.type === 'select' ? 
                          <select className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-orange outline-none appearance-none" value={(carFormData as any)[field.key] || ''} onChange={e => setCarFormData({...carFormData, [field.key]: e.target.value})}>
                            {field.opts.map((o:string) => <option key={o} value={o}>{o}</option>)}
                          </select> : 
                          <input 
                              type={field.type === 'number' ? 'number' : 'text'} 
                              step={field.type === 'number' ? "any" : undefined}
                              placeholder={field.placeholder || ''}
                              className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-orange outline-none" 
                              value={(carFormData as any)[field.key] || ''} 
                              onChange={e => {
                                const val = field.key === 'licensePlate' ? e.target.value.toUpperCase() : e.target.value;
                                setCarFormData({...carFormData, [field.key]: val})
                              }} 
                              maxLength={field.key === 'licensePlate' ? 8 : undefined}
                          />
                        }
                        {field.icon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{field.icon}</div>}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="grid grid-cols-2 gap-5 pt-4 border-t border-gray-800">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-orange uppercase">Preço Venda (R$)</label>
                    <input type="number" step="0.01" className="w-full bg-black/30 border border-brand-orange/50 rounded-lg px-3 py-3 text-lg font-bold text-white focus:border-brand-orange outline-none" placeholder="0.00" value={carFormData.price || ''} onChange={e => setCarFormData({...carFormData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tabela FIPE (R$)</label>
                    <input type="number" step="0.01" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-3 text-lg font-bold text-gray-400 focus:border-blue-500 outline-none" placeholder="0.00" value={carFormData.fipeprice || ''} onChange={e => setCarFormData({...carFormData, fipeprice: Number(e.target.value)})} />
                  </div>
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Descrição</label>
                  <textarea className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white h-24 focus:border-brand-orange outline-none resize-none" value={carFormData.description || ''} onChange={e => setCarFormData({...carFormData, description: e.target.value})}></textarea>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ABA FINANCEIRO --- */}
      {activeTab === 'financial' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Card Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Valor de Compra (Entrada)</span>
              <div className="flex items-center gap-2 mt-2">
                 <FaMoneyBillWave className="text-gray-500"/>
                 <input 
                   type="number" 
                   step="0.01"
                   className="bg-transparent text-xl font-black text-white w-full outline-none placeholder-gray-700"
                   placeholder="0.00"
                   value={carFormData.purchasePrice || ''}
                   onChange={e => setCarFormData({...carFormData, purchasePrice: Number(e.target.value)})}
                 />
              </div>
            </div>

            <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Total Despesas</span>
              <div className="flex items-center gap-2 mt-2">
                 <FaTools className="text-orange-500"/>
                 <span className="text-xl font-black text-white">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.totalExpenses)}
                 </span>
              </div>
            </div>

            <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Custo Total (Entrada + Gastos)</span>
               <span className="text-xl font-black text-white mt-2">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.totalCost)}
               </span>
            </div>

            <div className={`border p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden ${financialSummary.profit >= 0 ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
              <span className={`text-[10px] font-bold uppercase z-10 ${financialSummary.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                 {currentStatus === 'sold' ? 'Lucro Realizado' : 'Lucro Projetado'}
              </span>
              <div className="flex flex-col z-10">
                 <span className={`text-2xl font-black ${financialSummary.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.profit)}
                 </span>
                 <span className={`text-xs font-bold ${financialSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   ROI: {financialSummary.roi.toFixed(1)}%
                 </span>
              </div>
              {financialSummary.profit >= 0 ? 
                 <FaChartLine className="absolute -bottom-4 -right-4 text-8xl text-green-500/10"/> :
                 <FaChartLine className="absolute -bottom-4 -right-4 text-8xl text-red-500/10 transform rotate-180"/>
              }
            </div>
          </div>

          {/* Lista e Adição de Despesas */}
          <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2"><FaTools/> Histórico de Manutenção e Gastos</h3>
            
            {/* Form Adicionar Despesa */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-black/20 p-4 rounded-xl border border-gray-800 mb-6">
               <div className="md:col-span-2 space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase">Descrição</label>
                 <input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-orange outline-none" placeholder="Ex: Funilaria porta direita" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo</label>
                 <select className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" value={newExpense.type} onChange={e => setNewExpense({...newExpense, type: e.target.value as any})}>
                   <option value="maintenance">Manutenção</option>
                   <option value="repair">Reparo</option>
                   <option value="document">Documentação</option>
                   <option value="other">Outros</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 uppercase">Valor (R$)</label>
                 <input type="number" step="0.01" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-orange outline-none" placeholder="0.00" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
               </div>
               <div className="flex items-end">
                 <button type="button" onClick={handleAddExpense} className="w-full h-10 bg-brand-orange hover:bg-red-600 text-white font-bold rounded-lg text-xs uppercase flex items-center justify-center gap-2 transition">
                   <FaPlus/> Adicionar
                 </button>
               </div>
            </div>

            {/* Tabela de Despesas */}
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-800">
                     <th className="py-2 px-4">Data</th>
                     <th className="py-2 px-4">Descrição</th>
                     <th className="py-2 px-4">Tipo</th>
                     <th className="py-2 px-4">Valor</th>
                     <th className="py-2 px-4 text-right">Ação</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                    {!carFormData.expenses || carFormData.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 italic">Nenhum gasto registrado.</td>
                      </tr>
                    ) : (
                      carFormData.expenses.map((exp) => (
                        <tr key={exp.id} className="border-b border-gray-800/50 hover:bg-white/5 transition">
                          <td className="py-3 px-4 text-gray-400 font-mono text-xs">{new Date(exp.date).toLocaleDateString('pt-BR')}</td>
                          <td className="py-3 px-4 text-white font-medium">{exp.description}</td>
                          <td className="py-3 px-4">
                             <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                               exp.type === 'maintenance' ? 'bg-blue-500/10 text-blue-500' :
                               exp.type === 'document' ? 'bg-purple-500/10 text-purple-500' :
                               exp.type === 'repair' ? 'bg-orange-500/10 text-orange-500' : 'bg-gray-700 text-gray-400'
                             }`}>{exp.type}</span>
                          </td>
                          <td className="py-3 px-4 text-white font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                             <button type="button" onClick={() => handleRemoveExpense(exp.id)} className="text-red-500 hover:text-white transition p-2 bg-red-500/10 rounded-lg hover:bg-red-500"><FaTrash size={12}/></button>
                          </td>
                        </tr>
                      ))
                    )}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-800 mt-6 sticky bottom-0 bg-brand-dark/95 backdrop-blur p-4 z-20">
          <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 font-bold text-xs uppercase hover:bg-gray-800 transition">Cancelar</button>
          <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-brand-orange text-white font-bold text-xs uppercase shadow-glow hover:bg-red-600 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2">
              {saving ? <FaChevronRight className="animate-spin"/> : <FaSave/>} Salvar Alterações
          </button>
      </div>

    </form>
  </div>
  );
}
