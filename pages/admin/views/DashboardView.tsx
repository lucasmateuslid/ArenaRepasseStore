
import React from 'react';
import { 
  FaDollarSign, FaChartPie, FaCar, FaHeadset, FaToolbox, FaBan, FaCalendarCheck, FaUsers 
} from 'react-icons/fa';
import { Car, Seller } from '../../../types';
import { StatCard, SectionHeader } from '../components/AdminUI';

interface DashboardViewProps {
  cars: Car[];
  sellers: Seller[];
  setActiveTab: (tab: 'dashboard' | 'cars' | 'users' | 'sellers') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ cars, sellers, setActiveTab }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const soldCars = cars.filter(c => c.status === 'sold');
  
  const salesThisMonth = soldCars.filter(c => {
    if(!c.soldDate) return false;
    const d = new Date(c.soldDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const revenueThisMonth = salesThisMonth.reduce((acc, c) => acc + (Number(c.soldPrice) || Number(c.price) || 0), 0);

  const salesPrevMonth = soldCars.filter(c => {
    if(!c.soldDate) return false;
    const d = new Date(c.soldDate);
    return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
  });
  const revenuePrevMonth = salesPrevMonth.reduce((acc, c) => acc + (Number(c.soldPrice) || Number(c.price) || 0), 0);

  const revenueTrend = revenuePrevMonth > 0 ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100) : 100;

  const maintenanceCount = cars.filter(c => c.status === 'maintenance').length;
  const unavailableCount = cars.filter(c => c.status === 'unavailable').length;
  const availableCars = cars.filter(c => c.status === 'available' || !c.status);
  
  const totalStockValue = availableCars.reduce((acc, c) => acc + (Number(c.price) || 0), 0);
  const categories = availableCars.reduce((acc: any, car) => { 
    const cat = car.category || 'Outros'; 
    acc[cat] = (acc[cat] || 0) + 1; 
    return acc; 
  }, {} as Record<string, number>);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-0">
      <SectionHeader title="Dashboard Financeiro" subtitle={`Panorama de ${now.toLocaleString('pt-BR', { month: 'long' })} de ${currentYear}`} />
      
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
          value={formatMoney(soldCars.reduce((acc, c) => acc + (Number(c.soldPrice) || Number(c.price) || 0), 0))}
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
        
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[400px]">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><FaUsers /> Últimas Vendas</h3>
           <div className="space-y-3">
             {salesThisMonth.length === 0 ? <p className="text-gray-600 text-xs text-center">Nenhuma venda este mês.</p> :
               salesThisMonth.map((sale) => (
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
