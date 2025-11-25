import React from 'react';

interface FooterProps {
  handleWhatsApp: () => void;
}

export const Footer: React.FC<FooterProps> = ({ handleWhatsApp }) => {
  return (
    <footer className="bg-brand-darkRed border-t border-gray-800 text-white pt-12 pb-24 md:pb-6">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
           <div className="text-xl font-black italic tracking-tighter mb-4 text-gray-200">
            ARENA<span className="text-brand-orange">REPASSE</span>
          </div>
          <p className="text-gray-500 text-sm">
            Conectando oportunidades a investidores.
          </p>
        </div>
        <div className="col-span-1 md:col-span-2">
           <h4 className="font-bold mb-4 text-brand-orange text-sm uppercase">Atendimento</h4>
           <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-2 cursor-pointer hover:text-white" onClick={handleWhatsApp}><i className="fa-brands fa-whatsapp text-green-500 text-lg"></i> (11) 99999-9999</li>
            <li className="flex items-center gap-2"><i className="fa-solid fa-envelope text-brand-red text-lg"></i> contato@arenarepasse.com.br</li>
          </ul>
        </div>
        <div>
           <h4 className="font-bold mb-4 text-brand-orange text-sm uppercase">Segurança</h4>
           <div className="flex gap-3 text-2xl text-gray-500">
             <i className="fa-brands fa-cc-visa"></i>
             <i className="fa-brands fa-cc-mastercard"></i>
             <i className="fa-brands fa-pix"></i>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600 flex justify-center items-center gap-4">
        <span>&copy; 2025 Arena Repasse. Tecnologia Supabase Integrada.</span>
      </div>
    </footer>
  );
};