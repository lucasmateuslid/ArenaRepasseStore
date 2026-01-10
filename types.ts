
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
  color?: string;
  image: string;
  gallery: string[];
  location: string;
  description: string;
  is_active?: boolean;
  created_at?: string;
  category?: string;
  status?: 'available' | 'sold' | 'maintenance' | 'unavailable';
  vehicleType?: string;
  optionals?: string[];
  
  // Gestão avançada
  soldPrice?: number;
  soldDate?: string;
  soldBy?: string;
  licensePlate?: string;
  maintenanceReason?: string;
  
  // Gestão de clientes (venda)
  customerName?: string;
  customerCPF?: string;
  
  // Gestão Financeira
  purchasePrice?: number;
  expenses?: CarExpense[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at?: string;
  is_approved?: boolean;
  ip_address?: string;
  user_agent?: string;
}

export interface Seller {
  id: string;
  name: string;
  email?: string;
  whatsapp: string;
  active: boolean;
  created_at?: string;
  goal_qty?: number;
  goal_value?: number;
}

export interface CompanySettings {
  id?: string;
  company_name: string;
  cnpj: string;
  address: string;
  phone_whatsapp: string;
  email: string;
  opening_hours: string;
  social_instagram?: string;
  social_facebook?: string;
  social_youtube?: string;
  social_olx?: string;
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
  status?: string;
}
