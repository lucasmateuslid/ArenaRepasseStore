
import React from 'react';
import { FaUniversity } from 'react-icons/fa';

// Mapeamento de logos oficiais (mesmos assets de alta qualidade)
const BANK_LOGOS: Record<string, string> = {
  // Santander
  '33': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Banco_Santander_Logotipo.svg/2560px-Banco_Santander_Logotipo.svg.png',
  '033': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Banco_Santander_Logotipo.svg/2560px-Banco_Santander_Logotipo.svg.png',
  
  // BV Financeira
  '655': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Banco_Votorantim_logo_2019.png',
  
  // Itaú
  '341': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Ita%C3%BA.svg',
  
  // Bradesco
  '237': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Banco_Bradesco_logo_%28horizontal%29.svg/2560px-Banco_Bradesco_logo_%28horizontal%29.svg.png',
  
  // Banco Pan
  '623': 'https://logodownload.org/wp-content/uploads/2019/09/banco-pan-logo.png',
  
  // Banco Safra
  '422': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Banco_Safra_logo.svg'
};

interface BankIconProps {
  name?: string;       // Mantido para compatibilidade, mas priorizamos bankId
  bankId?: string | number;
  size?: string | number;
  color?: string;      // Não aplicável para imagens coloridas, mas mantido na interface
  borderRadius?: number;
  style?: React.CSSProperties;
}

const BankIcon: React.FC<BankIconProps> = ({ 
  bankId, 
  size = 24, 
  borderRadius = 2,
  style 
}) => {
  // Normaliza o ID para string
  const idStr = bankId ? String(bankId).replace(/^0+/, '') : ''; // Remove zeros a esquerda para facilitar match (33 vs 033)
  
  // Tenta encontrar com o ID exato ou com padStart
  const src = BANK_LOGOS[idStr] || BANK_LOGOS[String(bankId)];

  const iconStyle = {
    ...style,
    width: size,
    height: size,
    borderRadius: borderRadius,
  };

  if (!src) {
    // Fallback Icon se não encontrar o banco
    return (
      <div style={iconStyle} className="flex items-center justify-center bg-gray-200 text-gray-500 overflow-hidden">
        <FaUniversity style={{ fontSize: Number(size) * 0.6 }} />
      </div>
    );
  }

  return (
    <div 
      style={iconStyle} 
      className="flex items-center justify-center overflow-hidden bg-white p-[2px]" // Pequeno padding branco para garantir contraste
    >
      <img
        src={src}
        alt={`Banco ${bankId}`}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};

export default BankIcon;
