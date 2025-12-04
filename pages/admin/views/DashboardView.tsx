import React, { useMemo } from 'react';
import { 
  FaDollarSign, FaChartPie, FaCar, FaTag, FaTrophy, FaMedal, FaChartLine, FaLock 
} from 'react-icons/fa';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Car, Seller } from '../../../types';
import { StatCard, SectionHeader } from '../components/AdminUI';

interface DashboardViewProps {
  cars: Car[];
  sellers: Seller[];
  setActiveTab: (tab: 'dashboard' | 'cars' | 'users' | 'sellers') => void;
  isAdmin: boolean;
}

// Custom Tooltip for Area Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-surface border border-gray-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-gray-400 text-xs font-bold mb-1">{label}</p>
        <p className="text-brand-orange font-black text-sm">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
        </p>
        {payload[0].payload.count !== undefined && (
          <p className="text-gray-500 text-xs mt-1">{payload[0].payload.count} vendas</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-brand-surface border border-gray-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-white font-bold text-sm mb-1">{data.name}</p>
        <p className="text-brand-orange text-xs font-bold">
          {data.value} Veículos ({((data.percent || 0) * 100).toFixed(0)}%)
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669', '#0284C7', '#7C3AED', '#DB2777'];

export const DashboardView: React.FC<DashboardViewProps> = ({ cars, sellers, setActiveTab, isAdmin }) => {
  const formatMoney = (val: number) => {
    if (!isAdmin) return "R$ ****";
    return new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(val);
  };

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

    // 5. Estoque e Distribuição
    const availableCars = cars.filter(c => c.status === 'available' || !c.status);
    const totalStockValue = availableCars.reduce((acc, c) => acc + (Number(c.price) || 0), 0);
    
    const categoriesAvailable = availableCars.reduce((acc: any, car) => { 
        const cat = car.category || 'Outros'; 
        acc[cat] = (acc[cat] || 0) + 1; 
        return acc; 
    }, {} as Record<string, number>);

    // Transform for Recharts Pie
    const pieData = Object.entries(categoriesAvailable).map(([name, value]) => ({ name, value }));

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
      categoriesAvailable,
      pieData
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
          trend={isAdmin ? stats.revenueTrend : 0}
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
        
        {/* 2. Histórico de Faturamento (Area Chart) */}
        <div className="lg:col-span-2 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col relative h-[420px]">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
             <FaChartLine /> Tendência de Vendas (6 Meses)
           </h3>
           
           {!isAdmin && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-gray-700">
                 <FaLock className="text-4xl text-gray-500 mb-2"/>
                 <p className="text-gray-400 font-bold">Acesso Restrito a Administradores</p>
              </div>
           )}

           <div className="w-full flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.last6Months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#9CA3AF" 
                    tick={{fontSize: 12, fill: '#9CA3AF'}} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tick={{fontSize: 10, fill: '#9CA3AF'}} 
                    tickFormatter={(value) => isAdmin ? new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(value) : '****'}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  {isAdmin && <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#4B5563', strokeWidth: 1 }} />}
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#DC2626', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* 3. Top Vendedores (List) */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col relative h-[420px]">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
             <FaTrophy className="text-yellow-500"/> Ranking de Vendas
           </h3>

           {!isAdmin && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-gray-700">
                 <FaLock className="text-4xl text-gray-500 mb-2"/>
                 <p className="text-gray-400 font-bold">Acesso Restrito</p>
              </div>
           )}

           <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
             {stats.ranking.length === 0 ? <p className="text-gray-600 text-sm italic">Nenhuma venda registrada neste período.</p> :
               stats.ranking.map((seller, index) => (
                 <div key={index} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-gray-800/50 hover:border-brand-orange/30 transition group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border border-gray-700 transition-transform group-hover:scale-110
                      ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}
                    `}>
                      {index < 3 ? <FaMedal/> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-white truncate group-hover:text-brand-orange transition-colors">{seller.name}</p>
                       <p className="text-[10px] text-gray-500">{seller.count} veículos vendidos</p>
                    </div>
                    <p className="text-xs font-bold text-green-500">{isAdmin ? formatMoney(seller.total) : '****'}</p>
                 </div>
               ))
             }
           </div>
        </div>
      </div>

      {/* 4. Distribuição e Campeões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribuição por Categoria (Pie Chart) */}
        <div className="lg:col-span-1 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl h-[400px] flex flex-col">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
             <FaChartPie /> Estoque por Categoria
           </h3>
           <div className="w-full flex-1 min-h-0">
             {stats.pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={stats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                     >
                        {stats.pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <RechartsTooltip content={<CustomPieTooltip />} />
                     <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: '#9CA3AF' }}
                     />
                  </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm gap-2">
                  <FaCar className="text-2xl opacity-20"/>
                  <span>Sem dados de estoque.</span>
               </div>
             )}
           </div>
        </div>

        {/* Campeões de Vendas */}
        <div className="lg:col-span-1 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl h-[400px]">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2"><FaMedal /> Campeões de Vendas</h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-gray-800/50 hover:border-blue-500/30 transition">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-blue-500/20 text-blue-500 rounded-lg"><FaTag/></div>
                   <div><p className="text-[10px] text-gray-500 uppercase font-bold">Marca Favorita</p><p className="font-black text-white text-lg">{stats.topBrand[0]}</p></div>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded">{stats.topBrand[1]} un.</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-gray-800/50 hover:border-purple-500/30 transition">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-purple-500/20 text-purple-500 rounded-lg"><FaCar/></div>
                   <div><p className="text-[10px] text-gray-500 uppercase font-bold">Modelo Top 1</p><p className="font-black text-white text-lg">{stats.topModel[0]}</p></div>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded">{stats.topModel[1]} un.</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-gray-800/50 hover:border-orange-500/30 transition">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-orange-500/20 text-orange-500 rounded-lg"><FaChartPie/></div>
                   <div><p className="text-[10px] text-gray-500 uppercase font-bold">Categoria Líder</p><p className="font-black text-white text-lg">{stats.topCategory[0]}</p></div>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded">{stats.topCategory[1]} un.</span>
             </div>
          </div>
        </div>

        {/* Resumo Rápido Estoque */}
        <div className="lg:col-span-1 bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl h-[400px] flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><FaCar /> Status da Frota</h3>
             <button onClick={() => setActiveTab('cars')} className="text-xs text-brand-orange hover:text-white transition font-bold uppercase hover:underline">Ver Detalhes</button>
           </div>
           
           <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-black/20 p-4 rounded-xl border border-gray-800 text-center flex flex-col justify-center items-center hover:bg-black/30 transition group cursor-pointer" onClick={() => setActiveTab('cars')}>
                 <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{stats.availableCount}</p>
                 <div className="w-8 h-1 bg-blue-500 rounded-full my-2"></div>
                 <p className="text-[10px] uppercase font-bold text-gray-500">Disponíveis</p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-gray-800 text-center flex flex-col justify-center items-center hover:bg-black/30 transition group">
                 <p className="text-4xl font-black text-orange-500 group-hover:scale-110 transition-transform">{stats.maintenanceCount}</p>
                 <div className="w-8 h-1 bg-orange-500 rounded-full my-2"></div>
                 <p className="text-[10px] uppercase font-bold text-gray-500">Manutenção</p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-gray-800 text-center flex flex-col justify-center items-center hover:bg-black/30 transition group">
                 <p className="text-4xl font-black text-gray-500 group-hover:scale-110 transition-transform">{stats.unavailableCount}</p>
                 <div className="w-8 h-1 bg-gray-500 rounded-full my-2"></div>
                 <p className="text-[10px] uppercase font-bold text-gray-500">Indisponíveis</p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-gray-800 text-center flex flex-col justify-center items-center hover:bg-black/30 transition group">
                 <p className="text-4xl font-black text-green-500 group-hover:scale-110 transition-transform">{stats.salesCount}</p>
                 <div className="w-8 h-1 bg-green-500 rounded-full my-2"></div>
                 <p className="text-[10px] uppercase font-bold text-gray-500">Total Vendido</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};