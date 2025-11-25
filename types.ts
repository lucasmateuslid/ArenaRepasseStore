
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  fipeprice: number; // Corrigido para minúsculo para bater com o banco de dados
  mileage: number;
  fuel: string;
  transmission: string;
  image: string;
  gallery: string[];
  location: string;
  description: string;
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
