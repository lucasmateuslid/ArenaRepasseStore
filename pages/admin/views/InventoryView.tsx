
import React from 'react';
import { FaPlus, FaFilter, FaTrash, FaBan } from 'react-icons/fa';
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

  const displayYear = (year: number) => year === 3200 ? 'Zero KM' : year;

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-0">
      <SectionHeader 
        title="Controle de Frota" 
        subtitle="Gerencie disponibilidade, vendas e manutenções"
        action={
          // Apenas ADMIN vê o botão de criar
          isAdmin && (
            <button onClick={onNew} className="bg-brand-orange hover:bg-brand-orangeHover text-white px-5 py-3 rounded-xl text-sm font-bold uppercase flex items-center gap-2 shadow-glow transition transform active:scale-95 w-full md:w-auto justify-center">
              <FaPlus /> Novo Veículo
            </button>
          )
        }
      />

      <div className="bg-brand-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 bg-black/20">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder="Buscar por nome, placa, status..." 
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
                <div className="text-xs text-gray-500 mb-1 space-y-0.5">
                  <p>{displayYear(c.year)} • {c.category}</p>
                  <p className="font-mono text-[10px] text-gray-600">ID: {c.id.slice(0,6)}... | Placa: {c.licensePlate || '-'}</p>
                </div>
                <p className="text-brand-orange font-bold text-sm mb-2">R$ {c.price.toLocaleString('pt-BR')}</p>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-xs font-medium border border-gray-700"
                    >
                      Gerenciar
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} 
                      className="px-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded border border-red-500/30 transition flex items-center justify-center"
                      title="Excluir"
                    >
                      <FaTrash size={12}/>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Financeiro</th>
                {/* Apenas mostra coluna Ações se for admin */}
                {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {filteredCars.map((c: Car) => (
                <tr key={c.id} className="hover:bg-white/5 transition group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <img src={c.image} className="w-12 h-12 rounded-lg object-cover bg-gray-900 border border-gray-800" />
                    <div>
                      <span className="font-bold text-white block">{c.model}</span>
                      <span className="text-xs text-brand-orange">{c.make} • {displayYear(c.year)}</span>
                      <span className="text-[10px] text-gray-500 block font-mono mt-0.5">ID: {c.id.slice(0,8)} • Placa: {c.licensePlate || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(c.status || 'available')}
                    {c.status === 'maintenance' && <p className="text-[10px] text-gray-500 mt-1 max-w-[150px] truncate">{c.maintenanceReason}</p>}
                    {c.status === 'sold' && <p className="text-[10px] text-gray-500 mt-1">Vend: {c.soldBy}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">R$ {c.price.toLocaleString('pt-BR')}</p>
                    {c.status === 'sold' && (
                      <p className={`text-[10px] mt-1 ${isAdmin ? 'text-green-500' : 'text-gray-600'}`}>
                        Vendido por: {isAdmin ? `R$ ${Number(c.soldPrice).toLocaleString('pt-BR')}` : '****'}
                      </p>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition">
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                           className="px-3 py-1.5 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition text-xs font-bold" 
                           title="Editar"
                         >
                           GERENCIAR
                         </button>
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} 
                           className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition" 
                           title="Excluir"
                         >
                           <FaTrash/>
                         </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
