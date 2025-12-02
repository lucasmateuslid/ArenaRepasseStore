
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaChartPie, FaCar, FaHeadset, FaUsers, FaSignOutAlt, FaChevronRight 
} from 'react-icons/fa';
import { AppUser } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'cars' | 'users' | 'sellers') => void;
  appUser: AppUser | null;
  handleLogout: () => void;
  notification: { msg: string, type: 'success' | 'error' } | null;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, activeTab, setActiveTab, appUser, handleLogout, notification 
}) => {
  const menuItems = [
    { id: 'dashboard', icon: FaChartPie, label: 'Visão Geral' },
    { id: 'cars', icon: FaCar, label: 'Inventário' },
    { id: 'sellers', icon: FaHeadset, label: 'Vendedores' },
    { id: 'users', icon: FaUsers, label: 'Usuários' }
  ];

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-brand-surface border-r border-gray-800 flex-col fixed h-full z-50">
        <div className="h-20 flex items-center justify-center border-b border-gray-800">
          <Link to="/" className="text-xl font-black italic tracking-tighter hover:opacity-80 transition">
            ARENA<span className="text-brand-orange">ADMIN</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {menuItems.map(item => (
             <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
             >
               <item.icon /> {item.label}
             </button> 
           ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-xs font-bold text-gray-500 hover:text-red-500 transition px-4 py-2 w-full">
            <FaSignOutAlt/> Sair do Sistema
          </button>
          <Link to="/" className="flex items-center gap-3 text-xs font-bold text-gray-500 hover:text-white transition px-4 py-2 mt-2 w-full">
            <FaChevronRight/> Voltar ao Site
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-brand-surface border-t border-gray-800 z-50 flex justify-around p-2 pb-safe">
         {menuItems.map(item => ( 
           <button 
             key={item.id} 
             onClick={() => setActiveTab(item.id as any)} 
             className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition ${activeTab === item.id ? 'text-brand-orange bg-brand-orange/10' : 'text-gray-500'}`}
            >
              <item.icon className="text-lg mb-1"/>
              <span className="text-[9px] font-bold uppercase">{item.label}</span>
           </button> 
         ))}
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        <header className="h-16 md:h-20 bg-brand-dark/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
           <div className="md:hidden text-lg font-black italic">ARENA<span className="text-brand-orange">ADMIN</span></div>
           <h2 className="hidden md:block text-sm font-bold text-gray-400 uppercase tracking-widest">Painel Administrativo &bull; {activeTab}</h2>
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">{appUser?.name}</p>
                <p className="text-[10px] text-gray-500">{appUser?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-red-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {appUser?.name?.charAt(0) || 'A'}
              </div>
           </div>
        </header>

        {notification && (
          <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 animate-fade-in ${notification.type === 'success' ? 'bg-green-900/90 border-green-500' : 'bg-red-900/90 border-red-500'}`}>
            <p className="font-bold text-sm text-white">{notification.msg}</p>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
           {children}
        </main>
      </div>
    </div>
  );
};
