
import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
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

export const SectionHeader = ({ title, subtitle, action }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 animate-fade-in">
    <div>
      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);
