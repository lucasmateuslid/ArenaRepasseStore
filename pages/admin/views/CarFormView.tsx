
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FaTimes, FaCamera, FaPlus, FaSave, FaChevronRight, FaSearchDollar, 
  FaTruck, FaMotorcycle, FaCar, FaMapMarkerAlt, FaTrash, FaTools, FaMoneyBillWave, FaChartLine, FaChevronDown, FaSearch, FaCloudUploadAlt
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
  uploadStatus?: string;
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
  selectedBrandCode?: string;
  selectedModelCode?: string;
}

// Mapeamento automático idêntico ao Admin.tsx para consistência
const getVehicleTypeFromCategory = (category: string | undefined): string => {
  if (!category) return 'carros';
  const cat = category.toLowerCase();
  
  if (['moto', 'motos', 'motocicleta', 'scooter'].some(v => cat.includes(v))) {
    return 'motos';
  }
  
  if (['caminhão', 'caminhao', 'van', 'pesados', 'truck', 'onibus', 'ônibus'].some(v => cat.includes(v))) {
    return 'caminhoes';
  }
  
  return 'carros';
};

interface SearchableFipeSelectProps {
  options: any[];
  placeholder: string;
  onChange: (code: string) => void;
  disabled: boolean;
  stepLabel: string;
}

const SearchableFipeSelect: React.FC<SearchableFipeSelectProps> = ({ 
  options, placeholder, onChange, disabled, stepLabel 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(opt => 
    opt.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: string, name: string) => {
    setSelectedLabel(name);
    setSearch('');
    setIsOpen(false);
    onChange(code);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className={`w-full bg-gray-900 border ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-blue-500/30'} rounded-lg flex items-center justify-between p-2.5 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`text-xs ${selectedLabel ? 'text-white' : 'text-gray-400'} truncate select-none`}>
          {selectedLabel || placeholder}
        </span>
        <FaChevronDown className="text-gray-500 text-[10px]" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 mt-1 overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-gray-800 flex items-center gap-2 sticky top-0 bg-gray-900">
            <FaSearch className="text-gray-500 text-xs"/>
            <input 
              type="text" 
              autoFocus
              className="w-full bg-transparent text-xs text-white outline-none placeholder-gray-600"
              placeholder={`Pesquisar ${stepLabel}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.codigo} 
                  className="px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleSelect(opt.codigo, opt.nome); }}
                >
                  {opt.nome}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-500 text-center italic">
                Nenhum resultado encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const CarFormView: React.FC<CarFormViewProps> = ({
  carFormData, setCarFormData, mainImagePreview, setMainImagePreview,
  galleryFiles, setGalleryFiles, setMainImageFile, onSave, onCancel, saving, uploadStatus,
  vehicleType, setVehicleType, fipeBrands, fipeModels, fipeYears, 
  onFipeBrand, onFipeModel, onFipeYear, loadingFipe, onGetLocation, sellers,
  selectedBrandCode, selectedModelCode
}) => {
  const currentStatus = carFormData.status || 'available';
  const [activeTab, setActiveTab] = useState<'details' | 'financial'>('details');

  const [newExpense, setNewExpense] = useState<Partial<CarExpense>>({
    description: '',
    amount: 0,
    type: 'maintenance',
    date: new Date().toISOString().split('T')[0]
  });

  const financialSummary = useMemo(() => {
    const purchasePrice = Number(carFormData.purchasePrice) || 0;
    const currentPrice = Number(carFormData.price) || 0;
    const soldPrice = Number(carFormData.soldPrice) || 0;
    const totalExpenses = (carFormData.expenses || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalCost = purchasePrice + totalExpenses;
    const referenceRevenue = currentStatus === 'sold' ? soldPrice : currentPrice;
    const profit = referenceRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    return { purchasePrice, totalExpenses, totalCost, profit, roi, referenceRevenue };
  }, [carFormData.purchasePrice, carFormData.price, carFormData.soldPrice, carFormData.expenses, currentStatus]);

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const currentGallery = carFormData.gallery || [];
    const newGallery = currentGallery.filter((_, idx) => idx !== indexToRemove);
    setCarFormData({ ...carFormData, gallery: newGallery });
  };

  const handleRemoveNewGalleryFile = (indexToRemove: number) => {
    setGalleryFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || Number(newExpense.amount) <= 0) {
        alert("Preencha descrição e valor.");
        return;
    }
    const expense: CarExpense = {
      id: generateId(),
      description: newExpense.description!,
      amount: Number(newExpense.amount),
      date: newExpense.date || new Date().toISOString(),
      type: newExpense.type as any || 'maintenance'
    };
    const currentExpenses = carFormData.expenses || [];
    setCarFormData({ ...carFormData, expenses: [...currentExpenses, expense] });
    setNewExpense({ description: '', amount: 0, type: 'maintenance', date: new Date().toISOString().split('T')[0] });
  };

  const handleRemoveExpense = (id: string) => {
    if(window.confirm("Remover esta despesa?")) {
        const currentExpenses = carFormData.expenses || [];
        setCarFormData({ ...carFormData, expenses: currentExpenses.filter(e => e.id !== id) });
    }
  };

  // Handler para mudança de categoria com sincronização de vehicleType
  const handleCategoryChange = (val: string) => {
    const inferredType = getVehicleTypeFromCategory(val);
    setVehicleType(inferredType);
    setCarFormData({ ...carFormData, category: val, vehicleType: inferredType });
  };

  // Garante que o vehicleType da FIPE acompanhe a categoria se mudada manualmente
  useEffect(() => {
    if (carFormData.category) {
      const type = getVehicleTypeFromCategory(carFormData.category);
      if (type !== vehicleType) {
        setVehicleType(type);
      }
    }
  }, [carFormData.category]);

  return (
  <div className="max-w-6xl mx-auto pb-24 md:pb-0 animate-slide-up relative">
    {saving && (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center flex-col animate-fade-in">
        <div className="bg-brand-surface border border-gray-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full">
           <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-gray-700 border-t-brand-orange rounded-full animate-spin"></div>
              <FaCloudUploadAlt className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xl animate-pulse" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Processando...</h3>
           <p className="text-sm text-gray-400 text-center animate-pulse">{uploadStatus || 'Salvando informações...'}</p>
        </div>
      </div>
    )}

    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <h2 className="text-2xl font-black text-white">{carFormData.id ? 'Gerenciar Veículo' : 'Novo Cadastro'}</h2>
      <div className="flex bg-black/30 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
        <button type="button" onClick={() => setActiveTab('details')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${activeTab === 'details' ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
          <FaCar className="inline mr-2"/> Detalhes
        </button>
        <button type="button" onClick={() => setActiveTab('financial')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${activeTab === 'financial' ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
          <FaChartLine className="inline mr-2"/> Financeiro
        </button>
      </div>
    </div>

    <form onSubmit={onSave} className="space-y-6">
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-brand-surface border border-gray-800 rounded-2xl p-5">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Status do Veículo</label>
              <select className={`w-full p-3 rounded-xl border font-bold text-sm outline-none appearance-none ${currentStatus === 'available' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : currentStatus === 'sold' ? 'bg-green-500/10 border-green-500 text-green-500' : currentStatus === 'maintenance' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-gray-800 border-gray-600 text-gray-400'}`} value={currentStatus} onChange={e => setCarFormData({...carFormData, status: e.target.value as any})}>
                <option value="available">Disponível</option>
                <option value="sold">Vendido</option>
                <option value="maintenance">Em Manutenção</option>
                <option value="unavailable">Indisponível</option>
              </select>
              {currentStatus === 'maintenance' && (
                <div className="mt-4 animate-fade-in">
                  <label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">Motivo</label>
                  <input type="text" required className="w-full bg-black/30 border border-orange-500/30 rounded-lg p-2 text-sm text-white" value={carFormData.maintenanceReason || ''} onChange={e => setCarFormData({...carFormData, maintenanceReason: e.target.value})} />
                </div>
              )}
            </div>

            <div className="bg-brand-surface border border-gray-800 rounded-2xl p-5">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Capa Principal</label>
              <div className="relative aspect-video bg-black/50 rounded-xl border-2 border-dashed border-gray-700 hover:border-brand-orange group cursor-pointer overflow-hidden transition-colors mb-4">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={e => { if(e.target.files?.[0]) { setMainImageFile(e.target.files[0]); setMainImagePreview(URL.createObjectURL(e.target.files[0])); } }} accept="image/*" />
                {mainImagePreview ? (<img src={mainImagePreview} className="w-full h-full object-cover group-hover:opacity-60 transition" />) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600"><FaCamera className="text-3xl mb-2"/><span className="text-[10px] uppercase font-bold">Capa</span></div>)}
              </div>
              <div className="relative h-12 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-white cursor-pointer hover:bg-gray-700 transition border border-gray-700 mb-4">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])])} accept="image/*" />
                  <span className="text-xs font-bold flex items-center gap-2"><FaPlus/> Galeria</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {carFormData.gallery?.map((imgUrl, idx) => (
                  <div key={`old-${idx}`} className="relative aspect-square"><img src={imgUrl} className="w-full h-full object-cover rounded-lg border border-gray-700" /><button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"><FaTimes/></button></div>
                ))}
                {galleryFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square"><img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-lg border border-green-500/50" /><button type="button" onClick={() => handleRemoveNewGalleryFile(idx)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"><FaTimes/></button></div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs"><FaSearchDollar/></span>
                    <h4 className="text-sm font-bold text-blue-100">Ficha Técnica FIPE</h4>
                    <div className="ml-auto flex bg-black/30 rounded-lg p-1">
                      {['carros', 'motos', 'caminhoes'].map(t => (
                        <button type="button" key={t} onClick={() => setVehicleType(t)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${vehicleType === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{t === 'caminhoes' ? <FaTruck/> : t === 'motos' ? <FaMotorcycle/> : <FaCar/>}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <SearchableFipeSelect options={fipeBrands} onChange={onFipeBrand} disabled={false} placeholder="1. Marca" stepLabel="Marca" />
                    <SearchableFipeSelect key={selectedBrandCode || 'model'} options={fipeModels} onChange={onFipeModel} disabled={fipeModels.length === 0} placeholder="2. Modelo" stepLabel="Modelo" />
                    <SearchableFipeSelect key={selectedModelCode || 'year'} options={fipeYears} onChange={onFipeYear} disabled={fipeYears.length === 0} placeholder="3. Ano" stepLabel="Ano" />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Marca</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white" value={carFormData.make || ''} onChange={e => setCarFormData({...carFormData, make: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Modelo</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white" value={carFormData.model || ''} onChange={e => setCarFormData({...carFormData, model: e.target.value})} /></div>
                  
                  {/* CATEGORIA COM LÓGICA AUTOMÁTICA REFORÇADA */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-orange uppercase">Categoria (Obrigatório para Filtros)</label>
                    <select className="w-full bg-black/30 border border-brand-orange/30 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-orange outline-none" value={carFormData.category || ''} onChange={e => handleCategoryChange(e.target.value)}>
                      <option value="">Selecione...</option>
                      {['Hatch', 'Sedan', 'SUV', 'Pickup', 'Moto', 'Caminhão', 'Van'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Placa</label><input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white" value={carFormData.licensePlate || ''} onChange={e => setCarFormData({...carFormData, licensePlate: e.target.value.toUpperCase()})} maxLength={8} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Ano</label><input type="number" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white" value={carFormData.year || ''} onChange={e => setCarFormData({...carFormData, year: Number(e.target.value)})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">KM</label><input type="number" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white" value={carFormData.mileage || ''} onChange={e => setCarFormData({...carFormData, mileage: Number(e.target.value)})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Câmbio</label><select className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white" value={carFormData.transmission || ''} onChange={e => setCarFormData({...carFormData, transmission: e.target.value})}><option value="Manual">Manual</option><option value="Automático">Automático</option><option value="CVT">CVT</option></select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Combustível</label><select className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white" value={carFormData.fuel || ''} onChange={e => setCarFormData({...carFormData, fuel: e.target.value})}><option value="Flex">Flex</option><option value="Gasolina">Gasolina</option><option value="Diesel">Diesel</option></select></div>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-4 border-t border-gray-800">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-brand-orange uppercase">Preço Venda (R$)</label><input type="number" step="0.01" className="w-full bg-black/30 border border-brand-orange/50 rounded-lg px-3 py-3 text-lg font-bold text-white" value={carFormData.price || ''} onChange={e => setCarFormData({...carFormData, price: Number(e.target.value)})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-500 uppercase">Tabela FIPE (R$)</label><input type="number" step="0.01" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-3 text-lg font-bold text-gray-400" value={carFormData.fipeprice || ''} onChange={e => setCarFormData({...carFormData, fipeprice: Number(e.target.value)})} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl"><span className="text-[10px] font-bold text-gray-500 uppercase">Valor Compra</span><input type="number" step="0.01" className="bg-transparent text-xl font-black text-white w-full outline-none" value={carFormData.purchasePrice || ''} onChange={e => setCarFormData({...carFormData, purchasePrice: Number(e.target.value)})} /></div>
            <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl"><span className="text-[10px] font-bold text-gray-500 uppercase">Despesas</span><span className="block text-xl font-black text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.totalExpenses)}</span></div>
            <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl"><span className="text-[10px] font-bold text-gray-500 uppercase">Custo Total</span><span className="block text-xl font-black text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.totalCost)}</span></div>
            <div className={`border p-5 rounded-2xl ${financialSummary.profit >= 0 ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}><span className="text-[10px] font-bold uppercase block">{financialSummary.profit >= 0 ? 'Lucro' : 'Prejuízo'}</span><span className="text-xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.profit)}</span></div>
          </div>
          <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white text-lg mb-4">Adicionar Despesa</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
               <input type="text" className="md:col-span-2 bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white" placeholder="Descrição" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
               <input type="number" className="bg-black/30 border border-gray-700 rounded-lg p-2 text-sm text-white" placeholder="Valor" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
               <button type="button" onClick={handleAddExpense} className="bg-brand-orange text-white rounded-lg font-bold text-xs uppercase">Adicionar</button>
            </div>
            <table className="w-full text-left">
              <thead><tr className="text-[10px] text-gray-500 uppercase border-b border-gray-800"><th className="py-2">Data</th><th className="py-2">Descrição</th><th className="py-2 text-right">Valor</th><th className="py-2 text-right">Ação</th></tr></thead>
              <tbody className="text-sm">
                 {carFormData.expenses?.map((exp) => (<tr key={exp.id} className="border-b border-gray-800/50"><td className="py-2">{new Date(exp.date).toLocaleDateString('pt-BR')}</td><td className="py-2">{exp.description}</td><td className="py-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.amount)}</td><td className="py-2 text-right"><button type="button" onClick={() => handleRemoveExpense(exp.id)} className="text-red-500 p-2"><FaTrash/></button></td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 sticky bottom-0 bg-brand-dark/95 backdrop-blur p-4 z-20 border-t border-gray-800">
          <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 font-bold text-xs uppercase">Cancelar</button>
          <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-brand-orange text-white font-bold text-xs uppercase flex items-center gap-2">
              {saving ? 'Salvando...' : <><FaSave/> Salvar Alterações</>}
          </button>
      </div>
    </form>
  </div>
  );
}
