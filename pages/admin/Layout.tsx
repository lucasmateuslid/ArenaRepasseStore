
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaChartPie, FaCar, FaHeadset, FaUsers, FaSignOutAlt, 
  FaChevronRight, FaUserCog, FaChevronDown, FaFileAlt, 
  FaCogs, FaHome, FaExternalLinkAlt
} from 'react-icons/fa';
import { AppUser } from '../../types';

interface AdminLayoutProps {
  children: React.Node;
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'cars' | 'users' | 'sellers' | 'profile' | 'reports' | 'settings') => void;
  appUser: AppUser | null;
  handleLogout: () => void;
  notification: { msg: string, type: 'success' | 'error' } | null;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, activeTab, setActiveTab, appUser, handleLogout, notification 
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const mainItems = [
    { id: 'dashboard', icon: FaChartPie, label: 'Dashboard' },
    { id: 'reports', icon: FaFileAlt, label: 'Relatórios' },
    { id: 'cars', icon: FaCar, label: 'Estoque' },
  ];

  const systemItems = [
    { id: 'sellers', icon: FaHeadset, label: 'Consultores' },
    { id: 'users', icon: FaUsers, label: 'Acessos' },
    { id: 'settings', icon: FaCogs, label: 'Aparência' }
  ];

  // Fix: Explicitly allow the 'key' prop in the component's property type to satisfy strict JSX checks
  const NavButton = ({ item }: { item: any; key?: React.Key }) => (
    <button 
      onClick={() => setActiveTab(item.id as any)} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative
        ${activeTab === item.id 
          ? 'bg-brand-orange text-white shadow-[0_4px_15px_rgba(220,38,38,0.3)]' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <item.icon className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
      <span>{item.label}</span>
      {activeTab === item.id && (
        <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-brand-dark font-sans text-gray-100 flex flex-col md:flex-row">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex w-72 bg-brand-surface border-r border-gray-800 flex-col fixed h-full z-50 overflow-hidden">
        {/* Header Logo */}
        <div className="h-24 flex flex-col items-center justify-center border-b border-gray-800/50 bg-black/10">
          <Link to="/" className="flex items-center gap-2 group">
            <h1 className="text-2xl font-black italic tracking-tighter text-white transform -skew-x-6 group-hover:scale-105 transition-transform">
              ARENA<span className="text-brand-orange ml-1">ADMIN</span>
            </h1>
          </Link>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] mt-1">Management Suite</span>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
          
          {/* Section: Principal */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4">Principal</p>
            <div className="space-y-1">
              {mainItems.map(item => <NavButton key={item.id} item={item} />)}
            </div>
          </div>

          {/* Section: Sistema */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4">Gestão & Sistema</p>
            <div className="space-y-1">
              {systemItems.map(item => <NavButton key={item.id} item={item} />)}
            </div>
          </div>

          {/* User Section (Quick Access) */}
          <div className="pt-6 border-t border-gray-800/50">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                ${activeTab === 'profile' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}
              `}
            >
              <FaUserCog /> <span>Meu Perfil</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 bg-black/20 border-t border-gray-800/50 space-y-3">
          <Link 
            to="/" 
            className="flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition group"
          >
            <div className="flex items-center gap-2">
              <FaHome /> <span>Ver Site Público</span>
            </div>
            <FaExternalLinkAlt className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors"
          >
            <FaSignOutAlt /> <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <header className="md:hidden h-16 bg-brand-surface border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="text-xl font-black italic transform -skew-x-6">
          ARENA<span className="text-brand-orange ml-1">ADMIN</span>
        </div>
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-red-600 border border-white/20 flex items-center justify-center text-white font-bold text-xs"
        >
          {appUser?.name?.charAt(0) || 'A'}
        </button>
      </header>

      {/* --- MOBILE DOCK (BOTTOM) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-brand-surface/90 backdrop-blur-xl border-t border-gray-800 z-50 flex justify-around p-3 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
         {[...mainItems, ...systemItems.slice(0, 1), {id: 'settings', icon: FaCogs, label: 'Config'}].map(item => ( 
           <button 
             key={item.id} 
             onClick={() => setActiveTab(item.id as any)} 
             className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all
               ${activeTab === item.id ? 'text-brand-orange bg-brand-orange/10 scale-110' : 'text-gray-500'}
             `}
            >
              <item.icon className="text-lg mb-1"/>
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
           </button> 
         ))}
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col md:pl-72 min-h-screen">
        {/* Desktop Header Navigation Info */}
        <header className="hidden md:flex h-20 bg-brand-dark/95 backdrop-blur-md border-b border-gray-800/50 items-center justify-between px-10 sticky top-0 z-40">
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Painel</span>
              <FaChevronRight className="text-[8px] text-gray-700" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                {activeTab === 'dashboard' ? 'Visão Geral' : 
                 activeTab === 'reports' ? 'Relatórios Financeiros' : 
                 activeTab === 'cars' ? 'Controle de Frota' : 
                 activeTab === 'sellers' ? 'Equipe de Vendas' : 
                 activeTab === 'users' ? 'Gestão de Acessos' : 
                 activeTab === 'settings' ? 'Configurações' : 'Meu Perfil'}
              </span>
           </div>
           
           {/* Perfil Dropdown */}
           <div className="relative group">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
                className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-gray-800 p-2 pl-4 rounded-2xl transition cursor-pointer outline-none"
              >
                <div className="text-right">
                  <p className="text-xs font-black text-white">{appUser?.name || 'Administrador'}</p>
                  <p className="text-[9px] font-bold text-brand-orange uppercase">{appUser?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-red-600 flex items-center justify-center text-white font-black text-sm shadow-glow border border-white/10 overflow-hidden">
                  {appUser?.name?.charAt(0) || 'A'}
                </div>
              </button>

              {/* Menu suspenso flutuante */}
              <div className={`absolute right-0 top-full mt-3 w-56 bg-brand-surface border border-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform origin-top-right z-50 
                ${isProfileOpen ? 'translate-y-0 opacity-100 scale-100 visible' : 'translate-y-2 opacity-0 scale-95 invisible'}
              `}>
                 <div className="p-4 bg-black/20 border-b border-gray-800/50">
                    <p className="text-xs font-black text-white">{appUser?.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate">{appUser?.email}</p>
                 </div>
                 <div className="p-2">
                    <button onClick={() => setActiveTab('profile')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-brand-orange hover:text-white rounded-xl flex items-center gap-3 transition-colors">
                        <FaUserCog size={14}/> Configurações de Conta
                    </button>
                    <div className="h-px bg-gray-800 my-1 mx-2"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors">
                        <FaSignOutAlt size={14}/> Finalizar Sessão
                    </button>
                 </div>
              </div>
           </div>
        </header>

        {/* Notificações Flutuantes */}
        {notification && (
          <div className={`fixed top-24 right-6 z-[100] px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-l-4 animate-fade-in flex items-center gap-3
            ${notification.type === 'success' ? 'bg-green-950/90 border-green-500 text-green-100' : 'bg-red-950/90 border-red-500 text-red-100'}
          `}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
              ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
            `}>
              {notification.type === 'success' ? '✓' : '!'}
            </div>
            <p className="font-bold text-xs uppercase tracking-wide">{notification.msg}</p>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
           {children}
        </main>
      </div>
    </div>
  );
};
