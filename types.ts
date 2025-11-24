export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  fipePrice: number;
  mileage: number;
  fuel: string;
  transmission: string;
  image: string;
  gallery: string[]; // New field for modal photos
  location: string;
  description: string;
}

export interface CartItem extends Car {
  addedAt: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}