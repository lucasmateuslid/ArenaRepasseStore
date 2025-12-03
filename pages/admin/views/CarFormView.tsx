
import React from 'react';
import { 
  FaTimes, FaCamera, FaPlus, FaSave, FaChevronRight, FaSearchDollar, 
  FaTruck, FaMotorcycle, FaCar, FaMapMarkerAlt 
} from 'react-icons/fa';
import { Car, Seller } from '../../../types';

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

  return (
  <div className="max-w-5xl mx-auto pb-24 md:pb-0 animate-slide-up">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-black text-white">{carFormData.id ? 'Gerenciar Veículo' : 'Novo Cadastro'}</h2>
      <button onClick={onCancel} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full"><FaTimes/></button>
    </div>

    <form onSubmit={onSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
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
          <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Mídia</label>
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
          <div className="grid grid-cols-4 gap-2">
             <div className="relative aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 hover:text-white cursor-pointer hover:bg-gray-700 transition">
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setGalleryFiles(Array.from(e.target.files))} accept="image/*" />
              <FaPlus/>
            </div>
            {galleryFiles.length > 0 && <div className="col-span-3 flex items-center text-xs text-green-500 pl-2">+{galleryFiles.length} fotos novas</div>}
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
                 <select className="bg-black/20 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-100 outline-none focus:border-blue-500" onChange={e => onFipeBrand(e.target.value)}><option value="">1. Marca</option>{fipeBrands.map((b) => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}</select>
                 <select className="bg-black/20 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-100 outline-none focus:border-blue-500" onChange={e => onFipeModel(e.target.value)} disabled={fipeModels.length === 0}><option value="">2. Modelo</option>{fipeModels.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}</select>
                 <select className="bg-black/20 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-100 outline-none focus:border-blue-500" onChange={e => onFipeYear(e.target.value)} disabled={fipeYears.length === 0}><option value="">3. Ano</option>{fipeYears.map((y) => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}</select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[ 
                 { label: 'Marca', key: 'make', type: 'text' }, 
                 { label: 'Modelo', key: 'model', type: 'text' }, 
                 { label: 'Placa', key: 'licensePlate', type: 'text', placeholder: 'ABC-1234' },
                 { label: 'Ano', key: 'year', type: 'number' }, 
                 { label: 'Categoria', key: 'category', type: 'select', opts: ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Moto', 'Caminhão', 'Van'] }, 
                 { label: 'KM', key: 'mileage', type: 'number' }, 
                 { label: 'Combustível', key: 'fuel', type: 'select', opts: ['Flex','Gasolina','Diesel','Elétrico','Híbrido'] }, 
                 { label: 'Câmbio', key: 'transmission', type: 'select', opts: ['Manual','Automático','CVT'] }, 
                 { label: 'Cidade', key: 'location', type: 'text', icon: <FaMapMarkerAlt onClick={onGetLocation} className="cursor-pointer text-brand-orange hover:scale-110 transition"/> } 
               ].map((field: any) => (
                 <div key={field.key} className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">{field.label}</label>
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

           <div className="flex justify-end gap-4 pt-6">
              <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 font-bold text-xs uppercase hover:bg-gray-800 transition">Cancelar</button>
              <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-brand-orange text-white font-bold text-xs uppercase shadow-glow hover:bg-red-600 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2">
                 {saving ? <FaChevronRight className="animate-spin"/> : <FaSave/>} Salvar Alterações
              </button>
           </div>
        </form>
      </div>
    </form>
  </div>
  );
}
