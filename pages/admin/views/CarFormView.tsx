import React, { useState } from 'react';
import { 
  FaCamera, FaPlus, FaSave, FaCar, FaChartLine, FaTrash, 
  FaSearch, FaCheckSquare, FaSquare, FaMoneyBillWave, FaTimes,
  FaCogs, FaTools, FaCheck, FaMotorcycle, FaTruck, FaUserTie, FaCalendarAlt
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
  uploadProgress?: number;
  sellers: Seller[];
  // FIPE Props
  fipeBrands: any[];
  fipeModels: any[];
  fipeYears: any[];
  onFipeBrand: (code: string) => void;
  onFipeModel: (code: string) => void;
  onFipeYear: (code: string) => void;
  loadingFipe: boolean;
  selectedBrandCode: string;
  selectedModelCode: string;
  // Use specific union types to match Admin state
  vehicleType: 'carros' | 'motos' | 'caminhoes';
  setVehicleType: (type: 'carros' | 'motos' | 'caminhoes') => void;
}

const CATEGORIES = ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Moto', 'Caminhão', 'Van'];
const OPTIONALS_LIST = [
  'Ar condicionado', 'Direção Hidráulica', 'Vidros Elétricos', 'Travas Elétricas',
  'Alarme', 'Freio ABS', 'Airbag Duplo', 'Som Original', 'Rodas de Liga Leve',
  'Banco de Couro', 'Sensor de Estacionamento', 'Câmera de Ré', 'Teto Solar',
  'Farol de Neblina', 'Controle de Tração', 'Piloto Automático'
];

export const CarFormView: React.FC<CarFormViewProps> = ({
  carFormData, setCarFormData, mainImagePreview, setMainImagePreview,
  galleryFiles, setGalleryFiles, setMainImageFile, onSave, onCancel, saving, 
  uploadStatus, uploadProgress, fipeBrands, fipeModels, fipeYears, 
  onFipeBrand, onFipeModel, onFipeYear, loadingFipe, selectedBrandCode, selectedModelCode,
  vehicleType, setVehicleType, sellers
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'optionals' | 'financial'>('details');
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', type: 'maintenance' as any });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const toggleOptional = (opt: string) => {
    const current = carFormData.optionals || [];
    if (current.includes(opt)) {
      setCarFormData({ ...carFormData, optionals: current.filter(o => o !== opt) });
    } else {
      setCarFormData({ ...carFormData, optionals: [...current, opt] });
    }
  };

  const removeGalleryItem = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    if (carFormData.gallery) {
      setCarFormData({ ...carFormData, gallery: carFormData.gallery.filter((_, i) => i !== index) });
    }
  };

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    const expense: CarExpense = {
      id: Math.random().toString(36).substr(2, 9),
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: new Date().toISOString().split('T')[0],
      type: newExpense.type
    };
    setCarFormData({ ...carFormData, expenses: [...(carFormData.expenses || []), expense] });
    setNewExpense({ description: '', amount: '', type: 'maintenance' });
  };

  const expensesValue = carFormData.expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
  const totalCost = (Number(carFormData.purchasePrice) || 0) + expensesValue;
  const profit = (Number(carFormData.price) || 0) - totalCost;

  const selectClass = "w-full bg-brand-dark border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-orange outline-none appearance-none cursor-pointer transition-all";
  const selectIcon = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Gerenciar Veículo</h2>
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-gray-800">
          <button type="button" onClick={() => setActiveTab('details')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'details' ? 'bg-brand-orange text-white' : 'text-gray-500 hover:text-white'}`}>
            <FaCar /> Detalhes
          </button>
          <button type="button" onClick={() => setActiveTab('optionals')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'optionals' ? 'bg-brand-orange text-white' : 'text-gray-500 hover:text-white'}`}>
            <FaCheckSquare /> Opcionais
          </button>
          <button type="button" onClick={() => setActiveTab('financial')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'financial' ? 'bg-brand-orange text-white' : 'text-gray-500 hover:text-white'}`}>
            <FaChartLine /> Financeiro
          </button>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 shadow-xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">STATUS DO VEÍCULO</label>
                <div className={`p-4 rounded-xl border-2 mb-4 transition-all ${
                  carFormData.status === 'sold' ? 'border-green-500 bg-green-500/5 text-green-500' :
                  carFormData.status === 'maintenance' ? 'border-orange-500 bg-orange-500/5 text-orange-500' :
                  'border-gray-700 bg-black/20 text-blue-400'
                }`}>
                   <select 
                    className="bg-transparent w-full font-black text-sm uppercase outline-none cursor-pointer appearance-none"
                    value={carFormData.status || 'available'} 
                    onChange={e => setCarFormData({...carFormData, status: e.target.value as any})}
                    style={selectIcon}
                   >
                    <option value="available" className="bg-brand-dark text-white">Disponível</option>
                    <option value="sold" className="bg-brand-dark text-white">Vendido</option>
                    <option value="maintenance" className="bg-brand-dark text-white">Em Manutenção</option>
                  </select>
                </div>

                {carFormData.status === 'sold' && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 space-y-4 animate-slide-up">
                    <p className="text-[10px] font-black text-green-500 uppercase flex items-center gap-2"><FaCheck/> DADOS DA VENDA</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Consultor que vendeu</label>
                        <select className={selectClass} style={selectIcon} value={carFormData.soldBy || ''} onChange={e => setCarFormData({...carFormData, soldBy: e.target.value})}>
                          <option value="">Selecione...</option>
                          {sellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Data da Venda</label>
                        <input type="date" className="w-full bg-brand-dark border border-gray-700 rounded-xl p-3 text-xs text-white outline-none" value={carFormData.soldDate || ''} onChange={e => setCarFormData({...carFormData, soldDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Valor de Venda Final (R$)</label>
                        <input type="number" placeholder="0" className="w-full bg-brand-dark border border-gray-700 rounded-xl p-3 text-sm font-black text-green-500 outline-none" value={carFormData.soldPrice || ''} onChange={e => setCarFormData({...carFormData, soldPrice: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                )}

                {carFormData.status === 'maintenance' && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 space-y-4 animate-slide-up">
                    <p className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-2"><FaTools/> MOTIVO</p>
                    <input type="text" placeholder="Ex: Mecânica, Pintura..." className="w-full bg-brand-dark border border-gray-700 rounded-xl p-3 text-sm font-black text-white outline-none" value={carFormData.maintenanceReason || ''} onChange={e => setCarFormData({...carFormData, maintenanceReason: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 shadow-xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">CAPA PRINCIPAL</label>
                <div className="relative aspect-video bg-black/50 rounded-2xl border-2 border-dashed border-gray-700 hover:border-brand-orange overflow-hidden mb-4 group cursor-pointer">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={e => { if(e.target.files?.[0]) { setMainImageFile(e.target.files[0]); setMainImagePreview(URL.createObjectURL(e.target.files[0])); } }} accept="image/*" />
                  {mainImagePreview ? <img src={mainImagePreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700"><FaCamera className="text-3xl mb-2"/><span className="text-[10px] uppercase font-black">Anexar Capa</span></div>}
                </div>
                
                <div className="relative h-12 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-white cursor-pointer border border-gray-700 mb-6 transition">
                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])])} accept="image/*" />
                    <span className="text-[10px] font-black uppercase flex items-center gap-2"><FaPlus/> Galeria</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {carFormData.gallery?.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-800 group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryItem(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition"><FaTimes size={10}/></button>
                    </div>
                  ))}
                  {galleryFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-brand-orange group">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryItem(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md"><FaTimes size={10}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-brand-surface border border-gray-800 rounded-3xl p-8 shadow-2xl">
                <div className="bg-black/30 border border-blue-500/20 rounded-[2rem] p-8 mb-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FaSearch size={20}/></div>
                      <h3 className="font-black text-white uppercase italic tracking-tighter text-xl">Ficha Técnica FIPE</h3>
                    </div>
                    <div className="flex bg-black/40 p-1.5 rounded-xl border border-gray-800">
                       <button type="button" onClick={() => setVehicleType('carros')} className={`p-2.5 rounded-lg transition-all ${vehicleType === 'carros' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><FaCar/></button>
                       <button type="button" onClick={() => setVehicleType('motos')} className={`p-2.5 rounded-lg transition-all ${vehicleType === 'motos' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><FaMotorcycle/></button>
                       <button type="button" onClick={() => setVehicleType('caminhoes')} className={`p-2.5 rounded-lg transition-all ${vehicleType === 'caminhoes' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}><FaTruck/></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select className={selectClass} style={selectIcon} value={selectedBrandCode} onChange={e => onFipeBrand(e.target.value)}>
                      <option value="">1. Marca</option>
                      {fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                    </select>
                    <select className={selectClass} style={selectIcon} value={selectedModelCode} onChange={e => onFipeModel(e.target.value)}>
                      <option value="">2. Modelo</option>
                      {fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                    </select>
                    <select className={selectClass} style={selectIcon} onChange={e => onFipeYear(e.target.value)}>
                      <option value="">3. Ano</option>
                      {fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Marca</label>
                    <input type="text" className="w-full bg-black/40 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none" value={carFormData.make || ''} onChange={e => setCarFormData({...carFormData, make: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Modelo</label>
                    <input type="text" className="w-full bg-black/40 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none" value={carFormData.model || ''} onChange={e => setCarFormData({...carFormData, model: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Categoria (Filtros)</label>
                    <select className={selectClass} style={selectIcon} value={carFormData.category || ''} onChange={e => setCarFormData({...carFormData, category: e.target.value})}>
                      <option value="" className="bg-brand-dark">Selecione...</option>
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-brand-dark">{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Placa</label>
                    <input type="text" className="w-full bg-black/40 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none uppercase" value={carFormData.licensePlate || ''} onChange={e => setCarFormData({...carFormData, licensePlate: e.target.value.toUpperCase()})} maxLength={8} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ano</label>
                    <input type="number" className="w-full bg-black/40 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none" value={carFormData.year || ''} onChange={e => setCarFormData({...carFormData, year: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Kilometragem (KM)</label>
                    <input type="number" className="w-full bg-black/40 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none" value={carFormData.mileage || ''} onChange={e => setCarFormData({...carFormData, mileage: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cor</label>
                    <input type="text" className="w-full bg-black/40 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none" placeholder="Ex: Branco" value={carFormData.color || ''} onChange={e => setCarFormData({...carFormData, color: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Câmbio</label>
                    <select className={selectClass} style={selectIcon} value={carFormData.transmission || 'Manual'} onChange={e => setCarFormData({...carFormData, transmission: e.target.value})}>
                      <option value="Manual" className="bg-brand-dark">Manual</option>
                      <option value="Automático" className="bg-brand-dark">Automático</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Combustível</label>
                    <select className={selectClass} style={selectIcon} value={carFormData.fuel || 'Flex'} onChange={e => setCarFormData({...carFormData, fuel: e.target.value})}>
                      <option value="Flex" className="bg-brand-dark">Flex</option>
                      <option value="Gasolina" className="bg-brand-dark">Gasolina</option>
                      <option value="Diesel" className="bg-brand-dark">Diesel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 border-t border-gray-800 pt-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Preço Venda Arena (R$)</label>
                    <input type="number" className="w-full bg-black/40 border border-red-500/30 rounded-2xl px-6 py-6 text-4xl font-black text-white outline-none focus:border-red-500 shadow-lg" value={carFormData.price || ''} onChange={e => setCarFormData({...carFormData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tabela FIPE (R$)</label>
                    <input type="number" className="w-full bg-black/40 border border-gray-700 rounded-2xl px-6 py-6 text-4xl font-black text-gray-500 outline-none" value={carFormData.fipeprice || ''} onChange={e => setCarFormData({...carFormData, fipeprice: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optionals' && (
          <div className="bg-brand-surface border border-gray-800 rounded-[2.5rem] p-10 animate-fade-in shadow-2xl">
            <h3 className="text-xl font-black text-white mb-10 uppercase italic tracking-tighter flex items-center gap-4">
               <span className="w-10 h-1 bg-brand-orange rounded-full"></span> Itens e Opcionais do Veículo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OPTIONALS_LIST.map(opt => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => toggleOptional(opt)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${carFormData.optionals?.includes(opt) ? 'bg-brand-orange/10 border-brand-orange text-white shadow-glow' : 'bg-black/20 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                >
                  {carFormData.optionals?.includes(opt) ? <FaCheckSquare size={18} /> : <FaSquare size={18} />}
                  <span className="text-[11px] font-black uppercase tracking-tight">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-brand-surface border border-gray-800 p-8 rounded-[2rem] shadow-xl group hover:border-brand-orange/30 transition-all">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Valor de Compra</p>
                  <input type="number" className="bg-transparent text-3xl font-black text-white w-full outline-none focus:text-brand-orange transition-colors" value={carFormData.purchasePrice || ''} onChange={e => setCarFormData({...carFormData, purchasePrice: Number(e.target.value)})} placeholder="0" />
               </div>
               <div className="bg-brand-surface border border-gray-800 p-8 rounded-[2rem] shadow-xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Total Despesas</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(expensesValue)}</p>
               </div>
               <div className="bg-brand-surface border border-gray-800 p-8 rounded-[2rem] shadow-xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Custo Total</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(totalCost)}</p>
               </div>
               <div className="bg-green-500/5 border border-green-500/20 p-8 rounded-[2rem] shadow-xl">
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-4">Lucro Projetado</p>
                  <p className={`text-3xl font-black ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(profit)}</p>
               </div>
            </div>

            <div className="bg-brand-surface border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl">
              <h3 className="text-xl font-black text-white mb-10 uppercase italic tracking-tighter">Lançamento de Gastos</h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-black/40 p-8 rounded-3xl border border-gray-800 mb-10">
                 <div className="lg:col-span-5 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Descrição</label>
                    <input type="text" placeholder="Ex: Pintura para-choque" className="w-full bg-brand-dark border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                 </div>
                 <div className="lg:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Valor Gasto</label>
                    <input type="number" placeholder="0,00" className="w-full bg-brand-dark border border-gray-700 rounded-xl px-5 py-4 text-sm text-white focus:border-brand-orange outline-none" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                 </div>
                 <div className="lg:col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Categoria</label>
                    <select className={selectClass} style={selectIcon} value={newExpense.type} onChange={e => setNewExpense({...newExpense, type: e.target.value as any})}>
                      <option value="maintenance" className="bg-brand-dark">Manutenção Mecânica</option>
                      <option value="repair" className="bg-brand-dark">Estética / Funilaria</option>
                      <option value="document" className="bg-brand-dark">Documentação / IPVA</option>
                      <option value="other" className="bg-brand-dark">Outros / Diversos</option>
                    </select>
                 </div>
                 <div className="lg:col-span-1">
                    <button type="button" onClick={addExpense} className="w-full h-[58px] bg-brand-orange hover:bg-red-600 text-white font-black py-3 rounded-xl text-xs uppercase transition shadow-lg flex items-center justify-center">LANÇAR</button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="text-[11px] font-black text-gray-500 uppercase border-b border-gray-800">
                       <tr>
                          <th className="px-6 py-6">Data</th>
                          <th className="px-6 py-6">Descrição</th>
                          <th className="px-6 py-6 text-right">Valor</th>
                          <th className="px-6 py-6 text-center">Ação</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {carFormData.expenses?.map((exp) => (
                        <tr key={exp.id} className="text-sm group hover:bg-white/5 transition-colors">
                           <td className="px-6 py-6 text-gray-500">{new Date(exp.date).toLocaleDateString('pt-BR')}</td>
                           <td className="px-6 py-6 text-gray-300 font-bold">{exp.description}</td>
                           <td className="px-6 py-6 text-right text-white font-black">{formatCurrency(exp.amount)}</td>
                           <td className="px-6 py-6 text-center">
                              <button type="button" onClick={() => setCarFormData({...carFormData, expenses: carFormData.expenses?.filter(e => e.id !== exp.id)})} className="text-red-500 hover:text-white p-2 transition">
                                <FaTrash size={14}/>
                              </button>
                           </td>
                        </tr>
                      ))}
                      {(!carFormData.expenses || carFormData.expenses.length === 0) && (
                        <tr><td colSpan={4} className="py-16 text-center text-gray-600 italic text-xs">Nenhuma despesa lançada para este veículo.</td></tr>
                      )}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 p-6 bg-brand-dark/95 backdrop-blur-xl sticky bottom-0 border-t border-gray-800 rounded-b-3xl z-40 shadow-2xl">
            <button type="button" onClick={onCancel} className="px-8 py-4 rounded-2xl border border-gray-700 text-gray-400 font-black text-xs uppercase hover:bg-white/5 transition">CANCELAR</button>
            <button type="submit" disabled={saving} className="px-12 py-4 rounded-2xl bg-brand-orange text-white font-black text-xs uppercase shadow-glow hover:bg-red-600 transition flex items-center gap-2 italic">
                {saving ? 'PROCESSANDO...' : <><FaSave/> SALVAR ALTERAÇÕES</>}
            </button>
        </div>
      </form>
    </div>
  );
}