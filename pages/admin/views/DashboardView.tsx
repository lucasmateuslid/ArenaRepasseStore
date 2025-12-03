
import React, { useMemo } from 'react';
import { 
  FaDollarSign, FaChartPie, FaCar, FaHeadset, FaToolbox, FaBan, FaCalendarCheck, FaUsers, 
  FaTrophy, FaMedal, FaChartLine, FaTag
} from 'react-icons/fa';
import { Car, Seller } from '../../../types';
import { StatCard, SectionHeader } from '../components/AdminUI';

interface DashboardViewProps {
  cars: Car[];
  sellers: Seller[];
  setActiveTab: (tab: 'dashboard' | 'cars' | 'users' | 'sellers') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ cars, sellers, setActiveTab }) => {
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(val);

  // --- CÁLCULOS ESTATÍSTICOS ---
  const stats = useMemo(() => {
    const now = new Date();
    const soldCars = cars.filter(c => c.status === 'sold' && c.soldPrice && c.soldDate);
    
    // 1. Faturamento Geral e Mensal
    const totalRevenue = soldCars.reduce((acc, c) => acc + (Number(c.soldPrice) || 0), 0);
    
    const currentMonthSales = soldCars.filter(c => {
      const d = new Date(c.soldDate!);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const revenueThisMonth = currentMonthSales.reduce((acc, c) => acc + (Number(c.soldPrice) || 0), 0);

    const prevMonthDate = new Date();
    prevMonthDate.setMonth(now.getMonth() - 1);
    const prevMonthSales = soldCars.filter(c => {
      const d = new Date(c.soldDate!);
      return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear();
    });
    const revenuePrevMonth = prevMonthSales.reduce((acc, c) => acc + (Number(c.soldPrice) || 0), 0);
    const revenueTrend = revenuePrevMonth > 0 ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100) : 100;

    // 2. Histórico Últimos 6 Meses
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const monthKey = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
      const monthYear = d.getFullYear();
      
      const salesInMonth = soldCars.filter(c => {
        const date = new Date(c.soldDate!);
        return date.getMonth() === d.getMonth() && date.getFullYear() === monthYear;
      });
      
      const total = salesInMonth.reduce((acc, c) => acc + (Number(c.soldPrice) || 0), 0);
      last6Months.push({ label: monthKey, value: total, count: salesInMonth.length });
    }
    const maxHistoryValue = Math.max(...last6Months.map(m => m.value)) || 1;

    // 3. Top Vendedores
    const sellerMap: Record<string, { total: number, count: number }> = {};
    soldCars.forEach(c => {
      const name = c.soldBy || 'N/A';
      if (!sellerMap[name]) sellerMap[name] = { total: 0, count: 0 };
      sellerMap[name].total += Number(c.soldPrice) || 0;
      sellerMap[name].count += 1;
    });
    
    const ranking = Object.entries(sellerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5

    // 4. Mais Vendidos (Marca, Modelo, Categoria)
    const groupBy = (field: keyof Car) => {
      const map: Record<string, number> = {};
      soldCars.forEach(c => {
        const key = String(c[field] || 'Outros');
        map[key] = (map[key] || 0) + 1;
      });
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0] : ['-', 0];
    };

    const topBrand = groupBy('make');
    const topModel = groupBy('model');
    const topCategory = groupBy('category');

    // 5. Estoque
    const availableCars = cars.filter(c => c.status === 'available' || !c.status);
    const totalStockValue = availableCars.reduce((acc, c) => acc + (Number(c.price) || 0), 0);
    
    // Categorias Disponíveis
    const categoriesAvailable = availableCars.reduce((acc: any, car) => { 
        const cat = car.category || 'Outros'; 
        acc[cat] = (acc[cat] || 0) + 1; 
        return acc; 
    }, {} as Record<string, number>);

    return {
      revenueThisMonth,
      revenuePrevMonth,
      revenueTrend,
      totalRevenue,
      last6Months,
      maxHistoryValue,
      ranking,
      topBrand,
      topModel,
      topCategory,
      totalStockValue,
      salesCount: soldCars.length,
      currentMonthCount: currentMonthSales.length,
      availableCount: availableCars.length,
      maintenanceCount: cars.filter(c => c.status === 'maintenance').length,
      unavailableCount: cars.filter(c => c.status === 'unavailable').length,
      categoriesAvailable
    };
  }, [cars]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-0">
      <SectionHeader title="Dashboard Gerencial" subtitle="Visão completa de performance e financeiro" />
      
      {/* 1. KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Faturamento (Mês)" 
          value={formatMoney(stats.revenueThisMonth)} 
          subtext={`${stats.currentMonthCount} vendas este mês`} 
          trend={stats.revenueTrend}
          icon={FaDollarSign} 
          colorClass="text-green-500" 
        />
        <StatCard 
          title="Faturamento Total" 
          value={formatMoney(stats.totalRevenue)}
          subtext={`${stats.salesCount} vendas desde o início`}
          icon={FaChartLine} 
          colorClass="text-purple-500" 
        />
        <StatCard 
          title="Valor em Estoque" 
          value={formatMoney(stats.totalStockValue)} 
          subtext={`${stats.availableCount} veículos disponíveis`}
          icon={FaCar} 
          colorClass="text-brand-orange" 
        />
        <StatCard 
          title="Ticket Médio" 
          value={formatMoney(stats.salesCount > 0 ? stats.totalRevenue / stats.salesCount : 0)} 
          subtext="Por venda realizada"
          icon={FaTag} 
          colorClass="text-blue-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Histórico de Faturamento (Gráfico de Barras) */}
        <div className="lg:col-span-2 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
             <FaChartLine /> Histórico de Receita (6 Meses)
           </h3>
           <div className="flex items-end justify-between h-48 md:h-64 gap-2 md:gap-4">
             {stats.last6Months.map((m, idx) => {
               const heightPercent = Math.max((m.value / stats.maxHistoryValue) * 100, 5); // min 5% height
               return (
                 <div key={idx} className="flex flex-col items-center flex-1 group">
                   <div className="w-full bg-gray-800/50 rounded-t-lg relative flex items-end overflow-hidden hover:bg-gray-800 transition-colors h-full">
                     <div 
                       className="w-full bg-gradient-to-t from-brand-orange to-red-600 opacity-80 group-hover:opacity-100 transition-all duration-700 relative"
                       style={{ height: `${heightPercent}%` }}
                     >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-brand-dark text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                          {formatMoney(m.value)}
                        </div>
                     </div>
                   </div>
                   <div className="mt-3 text-center">
                     <p className="text-[10px] font-bold text-gray-400">{m.label}</p>
                     <p className="text-[9px] text-gray-600">{m.count} v.</p>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* 3. Top Vendedores */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
             <FaTrophy className="text-yellow-500"/> Ranking de Vendas
           </h3>
           <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
             {stats.ranking.length === 0 ? <p className="text-gray-600 text-sm">Nenhuma venda registrada.</p> :
               stats.ranking.map((seller, index) => (
                 <div key={index} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-gray-800/50 hover:border-brand-orange/30 transition">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border border-gray-700
                      ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}
                    `}>
                      {index < 3 ? <FaMedal/> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-white truncate">{seller.name}</p>
                       <p className="text-[10px] text-gray-500">{seller.count} veículos vendidos</p>
                    </div>
                    <p className="text-xs font-bold text-green-500">{formatMoney(seller.total)}</p>
                 </div>
               ))
             }
           </div>
        </div>
      </div>

      {/* 4. Campeões de Vendas & Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campeões */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2"><FaMedal /> Campeões de Vendas</h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg"><FaTag/></div>
                   <div><p className="text-[10px] text-gray-500 uppercase">Marca + Vendida</p><p className="font-bold text-white">{stats.topBrand[0]}</p></div>
                </div>
                <span className="text-xs font-bold text-gray-400">{stats.topBrand[1]} un.</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-500/20 text-purple-500 rounded-lg"><FaCar/></div>
                   <div><p className="text-[10px] text-gray-500 uppercase">Modelo + Vendido</p><p className="font-bold text-white">{stats.topModel[0]}</p></div>
                </div>
                <span className="text-xs font-bold text-gray-400">{stats.topModel[1]} un.</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg"><FaChartPie/></div>
                   <div><p className="text-[10px] text-gray-500 uppercase">Categoria Favorita</p><p className="font-bold text-white">{stats.topCategory[0]}</p></div>
                </div>
                <span className="text-xs font-bold text-gray-400">{stats.topCategory[1]} un.</span>
             </div>
          </div>
        </div>

        {/* Distribuição de Estoque (Existente) */}
        <div className="lg:col-span-2 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><FaChartPie /> Estoque Disponível</h3>
             <button onClick={() => setActiveTab('cars')} className="text-xs text-brand-orange hover:underline">Ver Inventário</button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/20 p-3 rounded-lg border border-gray-800 text-center">
                 <p className="text-2xl font-black text-white">{stats.availableCount}</p>
                 <p className="text-[10px] uppercase text-gray-500">Disponíveis</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-gray-800 text-center">
                 <p className="text-2xl font-black text-orange-500">{stats.maintenanceCount}</p>
                 <p className="text-[10px] uppercase text-gray-500">Manutenção</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-gray-800 text-center">
                 <p className="text-2xl font-black text-gray-500">{stats.unavailableCount}</p>
                 <p className="text-[10px] uppercase text-gray-500">Indisponíveis</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-gray-800 text-center">
                 <p className="text-2xl font-black text-green-500">{stats.salesCount}</p>
                 <p className="text-[10px] uppercase text-gray-500">Total Vendido</p>
              </div>
           </div>

           <div className="space-y-3">
             {Object.entries(stats.categoriesAvailable).map(([cat, count]: any) => {
               const percentage = Math.round((Number(count) / stats.availableCount) * 100) || 0;
               return (
                 <div key={cat} className="group">
                   <div className="flex justify-between text-xs mb-1 text-gray-400 font-medium">
                     <span>{cat}</span>
                     <span>{count} un. ({percentage}%)</span>
                   </div>
                   <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-brand-orange h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  );
};
