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
  image: string;
  gallery: string[];
  location: string;
  description: string;
  is_active?: boolean;
  created_at?: string;
  category?: string;
  status?: string;
  vehicleType?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  recommendedCarIds?: string[];
}

export interface FilterOptions {
  make?: string;
  year?: string;
  maxPrice?: string;
  search?: string;
}