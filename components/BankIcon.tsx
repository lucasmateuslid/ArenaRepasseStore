
import React, { useState, useEffect } from 'react';
import { FaUniversity } from 'react-icons/fa';

interface BankIconProps {
  bankId?: string | number;
  size?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

// Repositório de alta fidelidade para logos de bancos brasileiros
const BASE_URL = 'https://raw.githubusercontent.com/kelvins/brazilian-banks-icons/main/icons';

export const BankIcon: React.FC<BankIconProps> = ({ 
  bankId, 
  size = 28, 
  borderRadius = 4,
  style 
}) => {
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');

  const normalizeId = (id: string | number) => {
    if (!id) return null;
    const cleanId = String(id).replace(/\D/g, '');
    return cleanId.padStart(3, '0');
  };

  useEffect(() => {
    const code = normalizeId(bankId || '');
    if (code) {
      setImgSrc(`${BASE_URL}/${code}.svg`);
      setError(false);
    }
  }, [bankId]);

  const iconSize = typeof size === 'number' ? `${size}px` : size;

  const containerStyle: React.CSSProperties = {
    ...style,
    width: iconSize,
    height: iconSize,
    minWidth: iconSize,
    borderRadius: borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    padding: '3px', // Padding reduzido para minimalismo
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  };

  if (!bankId || error) {
    return (
      <div style={containerStyle} className="bg-white">
        <FaUniversity style={{ fontSize: `calc(${iconSize} * 0.6)`, color: '#333' }} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <img
        src={imgSrc}
        alt={`Banco ${bankId}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        loading="lazy"
        onError={() => setError(true)}
      />
    </div>
  );
};

export default BankIcon;
