
import React, { useState, useMemo } from 'react';
import { 
  FaFileCsv, FaChartLine, FaMoneyBillWave, FaTools, FaHandHoldingUsd, FaCalendarAlt 
} from 'react-icons/fa';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Car } from '../../../types';
import { SectionHeader } from '../components/AdminUI';

interface ReportsViewProps {
  cars: Car[];
}

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669', '#0284C7', '#7C3AED'];

export const ReportsView: React.FC<ReportsViewProps> = ({ cars }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  // --- FILTRAGEM DE DADOS ---
  const soldCars = useMemo(() => {
    return cars.filter(c => {
      if (c.status !== 'sold' || !c.soldDate) return false;
      const date = new Date(c.soldDate);
      
      const matchMonth = selectedMonth === 'all' || (date.getMonth() + 1) === Number(selectedMonth);
      const matchYear = selectedYear === 'all' || date.getFullYear() === Number(selectedYear);
      
      return matchMonth && matchYear;
    }).sort((a, b) => new Date(b.soldDate!).getTime() - new Date(a.soldDate!).getTime());
  }, [cars, selectedMonth, selectedYear]);

  // --- CÁLCULOS FINANCEIROS ---
  const financials = useMemo(() => {
    let totalPurchase = 0;
    let totalExpenses = 0;
    let totalRevenue = 0;

    soldCars.forEach(c => {
      totalPurchase += Number(c.purchasePrice) || 0;
      const exp = (c.expenses || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      totalExpenses += exp;
      totalRevenue += Number(c.soldPrice) || 0;
    });

    const totalCost = totalPurchase + totalExpenses;
    const netProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return { totalPurchase, totalExpenses, totalCost, totalRevenue, netProfit, roi };
  }, [soldCars]);

  // --- DADOS PARA GRÁFICOS ---
  const chartsData = useMemo(() => {
    // Por Categoria
    const categoryMap: Record<string, number> = {};
    soldCars.forEach(c => {
      const cat = c.category || 'Outros';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Por Vendedor
    const sellerMap: Record<string, { sales: number, revenue: number }> = {};
    soldCars.forEach(c => {
      const seller = c.soldBy || 'N/A';
      if (!sellerMap[seller]) sellerMap[seller] = { sales: 0, revenue: 0 };
      sellerMap[seller].sales += 1;
      sellerMap[seller].revenue += Number(c.soldPrice) || 0;
    });
    const barData = Object.entries(sellerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return { pieData, barData };
  }, [soldCars]);

  // --- EXPORTAR CSV ---
  const handleExportCSV = () => {
    const headers = [
      "Data Venda", "Modelo", "Placa", "Vendedor", 
      "Valor Compra", "Total Despesas", "Custo Total", "Valor Venda", "Lucro/Prejuízo", "ROI (%)"
    ];

    const rows = soldCars.map(c => {
      const purchase = Number(c.purchasePrice) || 0;
      const expenses = (c.expenses || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const cost = purchase + expenses;
      const sold = Number(c.soldPrice) || 0;
      const profit = sold - cost;
      const roi = cost > 0 ? ((profit / cost) * 100).toFixed(2) : '0';

      return [
        new Date(c.soldDate!).toLocaleDateString('pt-BR'),
        `${c.make} ${c.model}`,
        c.licensePlate || '-',
        c.soldBy || '-',
        purchase.toFixed(2).replace('.', ','),
        expenses.toFixed(2).replace('.', ','),
        cost.toFixed(2).replace('.', ','),
        sold.toFixed(2).replace('.', ','),
        profit.toFixed(2).replace('.', ','),
        roi.replace('.', ',')
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_vendas_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      
      {/* Header e Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <SectionHeader title="Relatórios Financeiros" subtitle="Análise detalhada de lucro, custos e performance" />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center bg-black/20 p-2 rounded-xl border border-gray-800">
           <div className="flex items-center gap-2 px-3 text-gray-500 text-sm font-bold uppercase"><FaCalendarAlt/> Período:</div>
           <select 
             value={selectedMonth} 
             onChange={e => setSelectedMonth(e.target.value)}
             className="bg-brand-surface border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-orange"
           >
             <option value="all">Todo o Ano</option>
             <option value="1">Janeiro</option>
             <option value="2">Fevereiro</option>
             <option value="3">Março</option>
             <option value="4">Abril</option>
             <option value="5">Maio</option>
             <option value="6">Junho</option>
             <option value="7">Julho</option>
             <option value="8">Agosto</option>
             <option value="9">Setembro</option>
             <option value="10">Outubro</option>
             <option value="11">Novembro</option>
             <option value="12">Dezembro</option>
           </select>
           <select 
             value={selectedYear} 
             onChange={e => setSelectedYear(e.target.value)}
             className="bg-brand-surface border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-orange"
           >
             <option value="all">Todos Anos</option>
             <option value="2024">2024</option>
             <option value="2025">2025</option>
             <option value="2026">2026</option>
           </select>
           <button 
             onClick={handleExportCSV}
             className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ml-auto"
           >
             <FaFileCsv /> Exportar Excel
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5"><FaMoneyBillWave size={60}/></div>
           <p className="text-gray-500 text-xs font-bold uppercase mb-1">Custo Total (Compra + Gastos)</p>
           <h3 className="text-2xl font-black text-white">{formatCurrency(financials.totalCost)}</h3>
           <p className="text-xs text-gray-400 mt-2">Compra: {formatCurrency(financials.totalPurchase)}</p>
        </div>

        <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5 text-blue-500"><FaHandHoldingUsd size={60}/></div>
           <p className="text-gray-500 text-xs font-bold uppercase mb-1">Faturamento Bruto</p>
           <h3 className="text-2xl font-black text-blue-400">{formatCurrency(financials.totalRevenue)}</h3>
           <p className="text-xs text-gray-400 mt-2">{soldCars.length} veículos vendidos</p>
        </div>

        <div className={`bg-brand-surface border p-5 rounded-2xl shadow-lg relative overflow-hidden ${financials.netProfit >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
           <div className={`absolute right-0 top-0 p-4 opacity-5 ${financials.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}><FaChartLine size={60}/></div>
           <p className={`text-xs font-bold uppercase mb-1 ${financials.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>Lucro Líquido Real</p>
           <h3 className={`text-2xl font-black ${financials.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(financials.netProfit)}</h3>
           <p className="text-xs text-gray-400 mt-2">Margem Líquida: {((financials.netProfit / financials.totalRevenue) * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-brand-surface border border-gray-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5 text-orange-500"><FaTools size={60}/></div>
           <p className="text-gray-500 text-xs font-bold uppercase mb-1">ROI (Retorno s/ Investimento)</p>
           <h3 className={`text-2xl font-black ${financials.roi >= 0 ? 'text-orange-400' : 'text-red-400'}`}>{financials.roi.toFixed(1)}%</h3>
           <p className="text-xs text-gray-400 mt-2">Gastos Extras: {formatCurrency(financials.totalExpenses)}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Vendedores */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl h-[400px] flex flex-col">
           <h4 className="text-white font-bold mb-4 flex items-center gap-2"><FaChartLine/> Top Vendedores (Faturamento)</h4>
           <div className="flex-1 min-h-0 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartsData.barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                 <XAxis type="number" stroke="#9CA3AF" tickFormatter={(val) => new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(val)} />
                 <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={80} />
                 <Tooltip 
                   cursor={{fill: '#ffffff10'}}
                   contentStyle={{ backgroundColor: '#18181b', borderColor: '#374151', color: '#fff' }}
                   formatter={(val: number) => formatCurrency(val)}
                 />
                 <Bar dataKey="revenue" fill="#DC2626" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Gráfico de Pizza - Categorias */}
        <div className="bg-brand-surface border border-gray-800 rounded-2xl p-6 shadow-xl h-[400px] flex flex-col">
           <h4 className="text-white font-bold mb-4 flex items-center gap-2"><FaChartLine/> Vendas por Categoria</h4>
           <div className="flex-1 min-h-0 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartsData.pieData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={100}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {chartsData.pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#374151', color: '#fff' }} />
                 <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-black/40 border-b border-gray-800">
           <h4 className="font-bold text-white text-sm uppercase">Detalhamento Financeiro (Veículos Vendidos)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/20 text-gray-500 text-[10px] uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3 text-right">Compra (Entrada)</th>
                <th className="px-4 py-3 text-right">Gastos</th>
                <th className="px-4 py-3 text-right text-blue-400">Venda</th>
                <th className="px-4 py-3 text-right">Lucro</th>
                <th className="px-4 py-3 text-center">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-xs">
              {soldCars.map(c => {
                const purchase = Number(c.purchasePrice) || 0;
                const expenses = (c.expenses || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                const cost = purchase + expenses;
                const sold = Number(c.soldPrice) || 0;
                const profit = sold - cost;
                const roi = cost > 0 ? ((profit / cost) * 100) : 0;

                return (
                  <tr key={c.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-gray-400">{new Date(c.soldDate!).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 font-bold text-white">{c.model} <span className="block text-[9px] text-gray-500 font-normal">{c.licensePlate}</span></td>
                    <td className="px-4 py-3 text-gray-300">{c.soldBy}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(purchase)}</td>
                    <td className="px-4 py-3 text-right text-orange-400">{formatCurrency(expenses)}</td>
                    <td className="px-4 py-3 text-right text-blue-300 font-bold">{formatCurrency(sold)}</td>
                    <td className={`px-4 py-3 text-right font-black ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(profit)}</td>
                    <td className="px-4 py-3 text-center">
                       <span className={`px-2 py-1 rounded ${profit >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                         {roi.toFixed(1)}%
                       </span>
                    </td>
                  </tr>
                );
              })}
              {soldCars.length === 0 && (
                <tr>
                   <td colSpan={8} className="py-8 text-center text-gray-500 italic">Nenhuma venda registrada no período selecionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
