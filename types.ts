
export interface CarExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'maintenance' | 'document' | 'repair' | 'other';
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  fipeprice: number;
  mileage: number;
  fuel: string;
  transmission: string;
  color?: string; // Novo campo para cor
  image: string;
  gallery: string[];
  location: string;
  description: string;
  is_active?: boolean;
  created_at?: string;
  category?: string;
  status?: 'available' | 'sold' | 'maintenance' | 'unavailable';
  vehicleType?: string;
  
  // Novos campos para gestão avançada
  soldPrice?: number;      // Valor real que foi vendido
  soldDate?: string;       // Data da venda
  soldBy?: string;         // Nome/ID do consultor que vendeu
  maintenanceReason?: string; // Motivo da manutenção
  licensePlate?: string;   // Placa do veículo
  
  // Gestão Financeira Detalhada
  purchasePrice?: number; // Valor de Entrada (Quanto pagou no carro)
  expenses?: CarExpense[]; // Histórico de gastos
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at?: string;
  
  // Controle de Acesso
  is_approved?: boolean;
  ip_address?: string;
  user_agent?: string; // Substituto do MAC (Navegadores bloqueiam acesso ao MAC Address)
}

export interface Seller {
  id: string;
  name: string;
  email?: string; // Novo campo para login
  whatsapp: string;
  active: boolean;
  created_at?: string;
}

export interface CompanySettings {
  id?: string;
  company_name: string;
  cnpj: string;
  address: string;
  phone_whatsapp: string; // WhatsApp Principal da Loja
  email: string;
  opening_hours: string;
  social_instagram?: string;
  social_facebook?: string;
  social_youtube?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  recommendedCarIds?: string[];
}

export interface FilterOptions {
  make?: string;
  year?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  vehicleType?: string;
  status?: string; // Novo filtro de status
}