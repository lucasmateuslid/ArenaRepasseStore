
import React, { useState } from 'react';
import { FaUniversity } from 'react-icons/fa';

interface BankIconProps {
  bankId?: string | number;
  size?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

// Repositório oficial de ícones bancários brasileiros (SVGs)
// Isso simula o comportamento da lib 'brazilian-bank-icons-svg'
const BASE_SVG_URL = 'https://raw.githubusercontent.com/kelvins/brazilian-banks-icons/main/icons';

const BankIcon: React.FC<BankIconProps> = ({ 
  bankId, 
  size = 24, 
  borderRadius = 4,
  style 
}) => {
  const [error, setError] = useState(false);

  // Normaliza o ID para 3 dígitos (Padrão COMPE usado no repositório)
  // Ex: 33 -> 033, 341 -> 341
  const normalizeId = (id: string | number) => {
    if (!id) return null;
    const cleanId = String(id).replace(/\D/g, '');
    return cleanId.padStart(3, '0');
  };

  const code = normalizeId(bankId || '');
  const iconSize = typeof size === 'number' ? `${size}px` : size;

  // Estilo do container
  const containerStyle: React.CSSProperties = {
    ...style,
    width: iconSize,
    height: iconSize,
    minWidth: iconSize, // Impede esmagamento
    borderRadius: borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff', // Fundo branco para garantir visibilidade do logo
    overflow: 'hidden',
    padding: '2px', // Margem de respiro
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  };

  // Se não tiver ID ou der erro no carregamento do SVG, mostra ícone genérico
  if (!code || error) {
    return (
      <div style={containerStyle} className="bg-gray-100">
        <FaUniversity style={{ fontSize: `calc(${iconSize} * 0.6)`, color: '#9ca3af' }} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <img
        src={`${BASE_SVG_URL}/${code}.svg`}
        alt={`Banco ${code}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        loading="lazy"
        onError={() => setError(true)}
      />
    </div>
  );
};

export default BankIcon;
