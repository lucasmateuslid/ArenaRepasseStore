
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchCars, createCar, updateCar, deleteCar, uploadCarImage, 
  fetchUsers, createUser, updateUser, deleteUser, 
  fetchSellers, createSeller, updateSeller, deleteSeller 
} from '../supabaseClient';
import { Car, AppUser, Seller } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaCar, FaDollarSign, 
  FaSearchDollar, FaChartPie, FaUsers, FaSignOutAlt, FaHeadset, FaWhatsapp, FaMapMarkerAlt, 
  FaMotorcycle, FaTruck, FaFilter, FaCamera, FaChevronRight, FaSync, FaEnvelope, FaToolbox, FaBan, FaCalendarCheck, FaArrowUp, FaArrowDown
} from 'react-icons/fa';

// Interfaces FIPE
interface FipeBrand { codigo: string; nome: string; }
interface FipeModel { codigo: number; nome: string; }
interface FipeYear { codigo: string; nome: string; }
interface FipeResult { Valor: string; Marca: string; Modelo: string; AnoModelo: number; Combustivel: string; }

// --- COMPONENTES UI AUXILIARES ---

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-brand-surface border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-brand-orange/30 transition-all duration-300 flex flex-col justify-between h-full">
    <div className={`absolute -right-6 -top-6 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 ${colorClass}`}>
      <Icon className="text-8xl"/>
    </div>
    <div>
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 z-10 relative flex items-center gap-2">
        {title}
      </h3>
      <p className="text-3xl md:text-4xl font-black text-white z-10 relative">{value}</p>
    </div>
    {(subtext || trend) && (
      <div className="mt-4 pt-4 border-t border-gray-800/50 flex items-center justify-between z-10 relative">
         {subtext && <p className="text-[10px] text-gray-500 font-medium">{subtext}</p>}
         {trend && (
           <span className={`text-xs font-bold flex items-center gap-1 ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
             {trend > 0 ? <FaArrowUp/> : trend < 0 ? <FaArrowDown/> : null} {Math.abs(trend)}% vs mês ant.
           </span>
         )}
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, subtitle, action }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 animate-fade-in">
    <div>
      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// --- VIEWS ---

const DashboardView = ({ cars, appUser, setActiveTab, sellers }: any) => {
  // Lógica Financeira do Mês
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const soldCars = cars.filter((c: Car) => c.status === 'sold');
  
  // Vendas Mês Atual
  const salesThisMonth = soldCars.filter((c: Car) => {
    if(!c.soldDate) return false;
    const d = new Date(c.soldDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const revenueThisMonth = salesThisMonth.reduce((acc: number, c: Car) => acc + (Number(c.soldPrice) || Number(c.price) || 0), 0);

  // Vendas Mês Anterior
  const salesPrevMonth = soldCars.filter((c: Car) => {
    if(!c.soldDate) return false;
    const d = new Date(c.soldDate);
    return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
  });
  const revenuePrevMonth = salesPrevMonth.reduce((acc: number, c: Car) => acc + (Number(c.soldPrice) || Number(c.price) || 0), 0);

  // Cálculo de Tendência
  const revenueTrend = revenuePrevMonth > 0 ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100) : 100;

  // Métricas de Estoque
  const maintenanceCount = cars.filter((c: Car) => c.status === 'maintenance').length;
  const unavailableCount = cars.filter((c: Car) => c.status === 'unavailable').length;
  const availableCars = cars.filter((c: Car) => c.status === 'available' || !c.status);
  
  const totalStockValue = availableCars.reduce((acc: number, c: Car) => acc + (Number(c.price) || 0), 0);
  const categories = availableCars.reduce((acc: any, car: Car) => { const cat = car.category || 'Outros'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-0">
      <SectionHeader title="Dashboard Financeiro" subtitle={`Panorama de ${now.toLocaleString('pt-BR', { month: 'long' })} de ${currentYear}`} />
      
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Faturamento (Mês)" 
          value={formatMoney(revenueThisMonth)} 
          subtext={`${salesThisMonth.length} veículos vendidos`} 
          trend={revenueTrend}
          icon={FaDollarSign} 
          colorClass="text-green-500" 
        />
        <StatCard 
          title="Faturamento (Total)" 
          value={formatMoney(soldCars.reduce((acc: number, c: Car) => acc + (Number(c.soldPrice) || Number(c.price) || 0), 0))}
          subtext={`${soldCars.length} vendas totais`}
          icon={FaChartPie} 
          colorClass="text-purple-500" 
        />
        <StatCard 
          title="Valor em Estoque" 
          value={formatMoney(totalStockValue)} 
          subtext={`${availableCars.length} disponíveis para venda`}
          icon={FaCar} 
          colorClass="text-brand-orange" 
        />
        <StatCard 
          title="Equipe de Vendas" 
          value={sellers.length} 
          subtext="Consultores Ativos"
          icon={FaHeadset} 
          colorClass="text-blue-500" 
        />
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-gray-800 p-4 rounded-xl flex items-center justify-between">
           <div><p className="text-[10px] uppercase text-gray-500 font-bold">Em Manutenção</p><p className="text-2xl font-black text-orange-400">{maintenanceCount}</p></div>
           <FaToolbox className="text-orange-400/20 text-3xl"/>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-4 rounded-xl flex items-center justify-between">
           <div><p className="text-[10px] uppercase text-gray-500 font-bold">Indisponíveis</p><p className="text-2xl font-black text-gray-400">{unavailableCount}</p></div>
           <FaBan className="text-gray-500/20 text-3xl"/>
        </div>
        <div className="bg-brand-surface border border-gray-800 p-4 rounded-xl flex items-center justify-between">
           <div><p className="text-[10px] uppercase text-gray-500 font-bold">Vendidos (Mês)</p><p className="text-2xl font-black text-green-500">{salesThisMonth.length}</p></div>
           <FaCalendarCheck className="text-green-500/20 text-3xl"/>
        </div>
         <div className="bg-brand-surface border border-gray-800 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-brand-orange transition" onClick={() => setActiveTab('cars')}>
           <div><p className="text-[10px] uppercase text-gray-500 font-bold">Total Estoque</p><p className="text-2xl font-black text-white">{cars.length}</p></div>
           <FaCar className="text-white/20 text-3xl"/>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2"><FaChartPie /> Distribuição por Categoria (Disponíveis)</h3>
           <div className="space-y-4">
             {Object.entries(categories).map(([cat, count]: any) => {
               const percentage = Math.round((Number(count) / availableCars.length) * 100) || 0;
               return (
                 <div key={cat} className="group">
                   <div className="flex justify-between text-sm mb-1 text-gray-300 font-medium">
                     <span>{cat}</span>
                     <span>{count} un. ({percentage}%)</span>
                   </div>
                   <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden">
                     <div className="bg-gradient-to-r from-brand-orange to-red-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                   </div>
                 </div>
               )
             })}
             {Object.keys(categories).length === 0 && <p className="text-gray-600 text-center py-4">Sem veículos disponíveis.</p>}
           </div>
        </div>
        
        {/* Vendedores Performance (Simulada/Simples) */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[400px]">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><FaUsers /> Últimas Vendas</h3>
           <div className="space-y-3">
             {salesThisMonth.length === 0 ? <p className="text-gray-600 text-xs text-center">Nenhuma venda este mês.</p> :
               salesThisMonth.map((sale: Car) => (
                 <div key={sale.id} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-gray-800/50">
                    <div className="w-8 h-8 rounded-full bg-green-900/50 text-green-500 flex items-center justify-center font-bold text-xs">
                      <FaDollarSign/>
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-white truncate">{sale.make} {sale.model}</p>
                       <p className="text-[10px] text-gray-500 truncate">Vend: {sale.soldBy || 'N/A'} • {new Date(sale.soldDate!).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <p className="text-xs font-bold text-green-500">{formatMoney(Number(sale.soldPrice))}</p>
                 </div>
               ))
             }
           </div>
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ 
  cars, searchTerm, setSearchTerm, onNew, onEdit, onDelete, onToggleStatus 
}: any) => {
  const filteredCars = cars.filter((c: Car) => 
    c.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status?.includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sold': return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-green-500/10 text-green-500 border-green-500">Vendido</span>;
      case 'maintenance': return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-orange-500/10 text-orange-500 border-orange-500">Manutenção</span>;
      case 'unavailable': return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-gray-500/10 text-gray-500 border-gray-500">Indisp.</span>;
      default: return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-blue-500/10 text-blue-500 border-blue-500">Disponível</span>;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader 
        title="Controle de Frota" 
        subtitle="Gerencie disponibilidade, vendas e manutenções"
        action={
          <button onClick={onNew} className="bg-brand-orange hover:bg-brand-orangeHover text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow transition transform active:scale-95 w-full md:w-auto justify-center">
            <FaPlus /> Novo Veículo
          </button>
        }
      />

      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 bg-black/20">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder="Buscar por nome, status..." 
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
                <p className="text-xs text-gray-500 mb-1">{c.year} • {c.category}</p>
                <p className="text-brand-orange font-bold text-sm mb-2">R$ {c.price.toLocaleString('pt-BR')}</p>
                <button onClick={() => onEdit(c)} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-xs font-medium border border-gray-700">Gerenciar / Editar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr><th className="px-6 py-4">Veículo</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Financeiro</th><th className="px-6 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {filteredCars.map((c: Car) => (
                <tr key={c.id} className="hover:bg-white/5 transition group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <img src={c.image} className="w-12 h-12 rounded-lg object-cover bg-gray-900 border border-gray-800" />
                    <div><span className="font-bold text-white block">{c.model}</span><span className="text-xs text-brand-orange">{c.make} • {c.year}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(c.status || 'available')}
                    {c.status === 'maintenance' && <p className="text-[10px] text-gray-500 mt-1 max-w-[150px] truncate">{c.maintenanceReason}</p>}
                    {c.status === 'sold' && <p className="text-[10px] text-gray-500 mt-1">Vend: {c.soldBy}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">R$ {c.price.toLocaleString('pt-BR')}</p>
                    {c.status === 'sold' && <p className="text-[10px] text-green-500">Vendido por: R$ {Number(c.soldPrice).toLocaleString('pt-BR')}</p>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition">
                       <button onClick={() => onEdit(c)} className="px-3 py-1.5 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition text-xs font-bold" title="Editar">GERENCIAR</button>
                       <button onClick={() => onDelete(c.id)} className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition" title="Excluir"><FaTrash/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CarFormView = ({
  carFormData, setCarFormData, mainImagePreview, setMainImagePreview,
  galleryFiles, setGalleryFiles, setMainImageFile, onSave, onCancel, saving,
  vehicleType, setVehicleType, fipeBrands, fipeModels, fipeYears, 
  onFipeBrand, onFipeModel, onFipeYear, loadingFipe, onGetLocation, sellers
}: any) => {
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
             onChange={e => setCarFormData({...carFormData, status: e.target.value})}
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
                  <input type="text" required className="w-full bg-black/30 border border-green-500/30 rounded-lg p-2 text-sm text-white" placeholder="0,00" value={carFormData.soldPrice || ''} onChange={e => setCarFormData({...carFormData, soldPrice: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Data da Venda</label>
                  <input type="date" required className="w-full bg-black/30 border border-green-500/30 rounded-lg p-2 text-sm text-white" value={carFormData.soldDate || new Date().toISOString().split('T')[0]} onChange={e => setCarFormData({...carFormData, soldDate: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block">Consultor Responsável</label>
                  <select required className="w-full bg-black/30 border border-green-500/30 rounded-lg p-2 text-sm text-white" value={carFormData.soldBy || ''} onChange={e => setCarFormData({...carFormData, soldBy: e.target.value})}>
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
             {/* Galeria simples - Melhorar se necessário */}
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
                 <select className="bg-black/20 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-100 outline-none focus:border-blue-500" onChange={e => onFipeBrand(e.target.value)}><option value="">1. Marca</option>{fipeBrands.map((b: FipeBrand) => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}</select>
                 <select className="bg-black/20 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-100 outline-none focus:border-blue-500" onChange={e => onFipeModel(e.target.value)} disabled={fipeModels.length === 0}><option value="">2. Modelo</option>{fipeModels.map((m: FipeModel) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}</select>
                 <select className="bg-black/20 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-100 outline-none focus:border-blue-500" onChange={e => onFipeYear(e.target.value)} disabled={fipeYears.length === 0}><option value="">3. Ano</option>{fipeYears.map((y: FipeYear) => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}</select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[ 
                 { label: 'Marca', key: 'make', type: 'text' }, 
                 { label: 'Modelo', key: 'model', type: 'text' }, 
                 { label: 'Ano', key: 'year', type: 'number' }, 
                 { label: 'Categoria', key: 'category', type: 'select', opts: ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Moto', 'Caminhão', 'Van'] }, 
                 { label: 'KM', key: 'mileage', type: 'text' }, 
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
                       <input type={field.type} className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-orange outline-none" value={(carFormData as any)[field.key] || ''} onChange={e => setCarFormData({...carFormData, [field.key]: e.target.value})} />
                     }
                     {field.icon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{field.icon}</div>}
                   </div>
                 </div>
               ))}
           </div>

           <div className="grid grid-cols-2 gap-5 pt-4 border-t border-gray-800">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-brand-orange uppercase">Preço Venda (R$)</label>
                 <input type="text" className="w-full bg-black/30 border border-brand-orange/50 rounded-lg px-3 py-3 text-lg font-bold text-white focus:border-brand-orange outline-none" placeholder="0,00" value={carFormData.price || ''} onChange={e => setCarFormData({...carFormData, price: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-gray-500 uppercase">Tabela FIPE (R$)</label>
                 <input type="text" className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-3 text-lg font-bold text-gray-400 focus:border-blue-500 outline-none" placeholder="0,00" value={carFormData.fipeprice || ''} onChange={e => setCarFormData({...carFormData, fipeprice: e.target.value})} />
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

// SellersView e UsersView (Mantidos similares)
const SellersView = ({ sellers, onSave, onDelete, saving, isCreating, setIsCreating, formData, setFormData }: any) => {
  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader title="Consultores" subtitle="Gerencie sua equipe de vendas" 
        action={<button onClick={() => { setIsCreating(!isCreating); setFormData({ active: true }); }} className="bg-brand-orange text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow"><FaPlus /> {isCreating ? 'Cancelar' : 'Novo'}</button>}
      />
      {isCreating && (
        <form onSubmit={onSave} className="bg-brand-surface border border-gray-800 rounded-2xl p-6 mb-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Nome</label><input type="text" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">WhatsApp</label><input type="text" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" placeholder="5511999999999" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value.replace(/\D/g,'')})} /></div>
           </div>
           <button type="submit" disabled={saving} className="mt-4 px-6 py-2 bg-brand-orange text-white rounded-lg font-bold text-xs uppercase hover:bg-red-600 transition">{saving ? '...' : 'Salvar'}</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sellers.map((s: Seller) => (
          <div key={s.id} className="bg-brand-surface border border-gray-800 p-4 rounded-xl flex items-center justify-between group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-lg"><FaWhatsapp/></div>
                <div><h4 className="font-bold text-white text-sm">{s.name}</h4><p className="text-xs text-gray-500">{s.whatsapp}</p></div>
             </div>
             <button onClick={() => onDelete(s.id)} className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg transition"><FaTrash size={12}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

const UsersView = ({ users, onSave, onDelete, saving, isCreating, setIsCreating, formData, setFormData }: any) => {
  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader title="Usuários do Sistema" 
        action={<button onClick={() => { setIsCreating(!isCreating); setFormData({ role: 'editor' }); }} className="bg-brand-orange text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow"><FaPlus /> {isCreating ? 'Cancelar' : 'Convidar'}</button>}
      />
      {isCreating && (
        <form onSubmit={onSave} className="bg-brand-surface border border-gray-800 rounded-2xl p-6 mb-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Nome</label><input type="text" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Email</label><input type="email" required className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Role</label><select className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-brand-orange outline-none" value={formData.role || 'editor'} onChange={e => setFormData({...formData, role: e.target.value})}><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
           </div>
           <button type="submit" disabled={saving} className="mt-4 px-6 py-2 bg-brand-orange text-white rounded-lg font-bold text-xs uppercase hover:bg-red-600 transition">{saving ? '...' : 'Salvar'}</button>
        </form>
      )}
      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm"><thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold"><tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Ação</th></tr></thead>
          <tbody className="divide-y divide-gray-800">
             {users.map((u: AppUser) => (
                <tr key={u.id} className="hover:bg-white/5">
                   <td className="px-6 py-4 text-white font-bold">{u.name}</td>
                   <td className="px-6 py-4 text-gray-400">{u.email}</td>
                   <td className="px-6 py-4 uppercase text-xs">{u.role}</td>
                   <td className="px-6 py-4 text-right"><button onClick={() => onDelete(u.id)} className="text-red-500 hover:text-white transition"><FaTrash/></button></td>
                </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Admin = () => {
  const { appUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'users' | 'sellers'>('dashboard');
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [carFormData, setCarFormData] = useState<Partial<Car>>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Aux Form States
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormData, setUserFormData] = useState<Partial<AppUser>>({ role: 'editor' });
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({ active: true });

  // FIPE
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [vehicleType, setVehicleType] = useState('carros');
  const [selectedFipeBrand, setSelectedFipeBrand] = useState('');
  const [selectedFipeModel, setSelectedFipeModel] = useState('');

  useEffect(() => { loadAllData(); loadFipeBrands(); }, [vehicleType]);

  const loadAllData = async () => {
    const carsRes = await fetchCars({});
    const usersRes = await fetchUsers();
    const sellersRes = await fetchSellers();
    if (carsRes.error) showNotification(String(carsRes.error), 'error');
    setCars(carsRes.data || []);
    setUsers(usersRes.data || []);
    setSellers(sellersRes.data || []);
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };
  const showNotification = (msg: string, type: 'success' | 'error') => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 5000); };
  const cleanNumber = (val: any): number => { if (!val) return 0; if (typeof val === 'number') return val; const str = String(val).replace(/\./g, '').replace(',', '.'); const num = parseFloat(str); return isNaN(num) ? 0 : num; };

  // CRUD Carros
  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carFormData.make || !carFormData.model) return showNotification("Preencha Marca e Modelo", 'error');
    setSaving(true);
    try {
      let finalImage = carFormData.image;
      if (mainImageFile) {
        const url = await uploadCarImage(mainImageFile);
        if (url) finalImage = url;
        else throw new Error("Erro no upload da imagem principal.");
      }
      if (!finalImage) throw new Error("Foto principal obrigatória");
      const newGalleryUrls = [];
      for (const file of galleryFiles) {
        const url = await uploadCarImage(file);
        if (url) newGalleryUrls.push(url);
      }
      const finalGallery = [...(carFormData.gallery || []), ...newGalleryUrls];
      const payload = {
        ...carFormData,
        price: cleanNumber(carFormData.price),
        fipeprice: cleanNumber(carFormData.fipeprice),
        mileage: cleanNumber(carFormData.mileage),
        year: cleanNumber(carFormData.year) || new Date().getFullYear(),
        soldPrice: carFormData.status === 'sold' ? cleanNumber(carFormData.soldPrice) : null,
        image: finalImage,
        gallery: finalGallery,
        is_active: true,
        vehicleType: vehicleType,
        status: carFormData.status || 'available'
      };
      if (carFormData.id) { const { error } = await updateCar(carFormData.id, payload); if (error) throw error; } 
      else { const { error } = await createCar(payload as any); if (error) throw error; }
      showNotification("Veículo salvo!", 'success'); setIsEditingCar(false); loadAllData();
    } catch (err: any) { showNotification(err.message || "Erro ao salvar", 'error'); } 
    finally { setSaving(false); }
  };

  const handleCarDelete = async (id: string) => { if (confirm("Excluir veículo permanentemente?")) { const { error } = await deleteCar(id); if (error) showNotification(String(error.message), 'error'); else { showNotification("Veículo excluído.", 'success'); loadAllData(); } } };
  const toggleCarStatus = async (car: Car) => { const newStatus = car.status === 'sold' ? 'available' : 'sold'; const { error } = await updateCar(car.id, { status: newStatus }); if (!error) loadAllData(); };

  // CRUD Sellers/Users
  const handleSellerSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); const { error } = await createSeller(sellerFormData as any); if(error) showNotification(error.message, 'error'); else { showNotification("Consultor adicionado!", 'success'); setIsCreatingSeller(false); loadAllData(); } setSaving(false); };
  const handleSellerDelete = async (id: string) => { if(confirm("Remover?")) { await deleteSeller(id); loadAllData(); } };
  const handleUserSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); const { error } = await createUser(userFormData as any); if(error) showNotification(error.message, 'error'); else { showNotification("Autorizado!", 'success'); setIsCreatingUser(false); loadAllData(); } setSaving(false); };
  const handleUserDelete = async (id: string) => { if(confirm("Revogar?")) { await deleteUser(id); loadAllData(); } };

  // FIPE/Location
  const loadFipeBrands = async () => { try { setFipeBrands([]); const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas`); setFipeBrands(await res.json()); } catch (e) {} };
  const handleFipeBrand = async (codigo: string) => { setSelectedFipeBrand(codigo); setSelectedFipeModel(''); setFipeModels([]); if(codigo) { setLoadingFipe(true); const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${codigo}/modelos`); const data = await res.json(); setFipeModels(data.modelos); setLoadingFipe(false); } };
  const handleFipeModel = async (codigo: string) => { setSelectedFipeModel(codigo); setFipeYears([]); if(codigo) { setLoadingFipe(true); const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${codigo}/anos`); setFipeYears(await res.json()); setLoadingFipe(false); } };
  const handleFipeYear = async (codigo: string) => { if(!codigo) return; setLoadingFipe(true); try { const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${selectedFipeBrand}/modelos/${selectedFipeModel}/anos/${codigo}`); const data: FipeResult = await res.json(); const val = parseFloat(data.Valor.replace('R$ ', '').replace('.','').replace(',','.')); 
    const autoDetectCategory = (modelName: string) => { const name = modelName.toLowerCase(); if (vehicleType === 'motos') return 'Moto'; if (vehicleType === 'caminhoes') return 'Caminhão'; if (name.includes('hilux') || name.includes('s10') || name.includes('ranger') || name.includes('toro')) return 'Pickup'; if (name.includes('suv') || name.includes('compass') || name.includes('creta')) return 'SUV'; if (name.includes('sedan') || name.includes('corolla') || name.includes('civic')) return 'Sedan'; return 'Hatch'; };
    setCarFormData(prev => ({ ...prev, make: data.Marca, model: data.Modelo, year: data.AnoModelo, fipeprice: val, fuel: data.Combustivel, category: autoDetectCategory(data.Modelo) })); } catch(e) {} finally { setLoadingFipe(false); } };
  const handleGetLocation = () => { if (!navigator.geolocation) return showNotification("Indisponível", 'error'); setLoadingLocation(true); navigator.geolocation.getCurrentPosition(async (pos) => { try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`); const data = await res.json(); const city = data.address.city || data.address.town || data.address.municipality; const state = data.address.state_code || data.address.state; setCarFormData(prev => ({ ...prev, location: `${city}, ${state}` })); showNotification("Localização obtida!", 'success'); } catch (e) { showNotification("Erro ao buscar endereço", 'error'); } finally { setLoadingLocation(false); } }); };

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-gray-100 flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 bg-brand-surface border-r border-gray-800 flex-col fixed h-full z-50">
        <div className="h-20 flex items-center justify-center border-b border-gray-800"><Link to="/" className="text-xl font-black italic tracking-tighter hover:opacity-80 transition">ARENA<span className="text-brand-orange">ADMIN</span></Link></div>
        <nav className="flex-1 p-4 space-y-2">
           {[ { id: 'dashboard', icon: FaChartPie, label: 'Visão Geral' }, { id: 'cars', icon: FaCar, label: 'Inventário' }, { id: 'sellers', icon: FaHeadset, label: 'Vendedores' }, { id: 'users', icon: FaUsers, label: 'Usuários' } ].map(item => ( <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsEditingCar(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><item.icon /> {item.label}</button> ))}
        </nav>
        <div className="p-4 border-t border-gray-800"><button onClick={handleLogout} className="flex items-center gap-3 text-xs font-bold text-gray-500 hover:text-red-500 transition px-4 py-2 w-full"><FaSignOutAlt/> Sair do Sistema</button><Link to="/" className="flex items-center gap-3 text-xs font-bold text-gray-500 hover:text-white transition px-4 py-2 mt-2 w-full"><FaChevronRight/> Voltar ao Site</Link></div>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-brand-surface border-t border-gray-800 z-50 flex justify-around p-2 pb-safe">
         {[ { id: 'dashboard', icon: FaChartPie, label: 'Dash' }, { id: 'cars', icon: FaCar, label: 'Carros' }, { id: 'sellers', icon: FaHeadset, label: 'Equipe' }, { id: 'users', icon: FaUsers, label: 'Admin' } ].map(item => ( <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsEditingCar(false); }} className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition ${activeTab === item.id ? 'text-brand-orange bg-brand-orange/10' : 'text-gray-500'}`}><item.icon className="text-lg mb-1"/><span className="text-[9px] font-bold uppercase">{item.label}</span></button> ))}
      </nav>
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        <header className="h-16 md:h-20 bg-brand-dark/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
           <div className="md:hidden text-lg font-black italic">ARENA<span className="text-brand-orange">ADMIN</span></div>
           <h2 className="hidden md:block text-sm font-bold text-gray-400 uppercase tracking-widest">Painel Administrativo &bull; {activeTab}</h2>
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block"><p className="text-xs font-bold text-white">{appUser?.name}</p><p className="text-[10px] text-gray-500">{appUser?.role}</p></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-red-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">{appUser?.name?.charAt(0) || 'A'}</div>
           </div>
        </header>
        {notification && <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 animate-fade-in ${notification.type === 'success' ? 'bg-green-900/90 border-green-500' : 'bg-red-900/90 border-red-500'}`}><p className="font-bold text-sm text-white">{notification.msg}</p></div>}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
           {activeTab === 'dashboard' && <DashboardView cars={cars} appUser={appUser} sellers={sellers} setActiveTab={setActiveTab} />}
           {activeTab === 'cars' && !isEditingCar && <InventoryView cars={cars} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onNew={() => { setCarFormData({ gallery: [], is_active: true, category: 'Hatch', status: 'available', vehicleType: 'carros' }); setMainImagePreview(null); setMainImageFile(null); setGalleryFiles([]); setIsEditingCar(true); }} onEdit={(c: Car) => { setCarFormData({...c}); setVehicleType(c.vehicleType || 'carros'); setMainImagePreview(c.image); setGalleryFiles([]); setIsEditingCar(true); }} onDelete={handleCarDelete} onToggleStatus={toggleCarStatus} />}
           {activeTab === 'cars' && isEditingCar && <CarFormView carFormData={carFormData} setCarFormData={setCarFormData} mainImagePreview={mainImagePreview} setMainImagePreview={setMainImagePreview} galleryFiles={galleryFiles} setGalleryFiles={setGalleryFiles} setMainImageFile={setMainImageFile} onSave={handleCarSave} onCancel={() => setIsEditingCar(false)} saving={saving} vehicleType={vehicleType} setVehicleType={setVehicleType} fipeBrands={fipeBrands} fipeModels={fipeModels} fipeYears={fipeYears} onFipeBrand={handleFipeBrand} onFipeModel={handleFipeModel} onFipeYear={handleFipeYear} loadingFipe={loadingFipe} onGetLocation={handleGetLocation} sellers={sellers} />}
           {activeTab === 'sellers' && <SellersView sellers={sellers} onSave={handleSellerSave} onDelete={handleSellerDelete} saving={saving} isCreating={isCreatingSeller} setIsCreating={setIsCreatingSeller} formData={sellerFormData} setFormData={setSellerFormData} />}
           {activeTab === 'users' && <UsersView users={users} onSave={handleUserSave} onDelete={handleUserDelete} saving={saving} isCreating={isCreatingUser} setIsCreating={setIsCreatingUser} formData={userFormData} setFormData={setUserFormData} />}
        </main>
      </div>
    </div>
  );
};
