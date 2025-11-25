export interface Car {
  id: string; // Changed from number to string for Firestore compatibility
  make: string;
  model: string;
  year: number;
  price: number;
  fipePrice: number;
  mileage: number;
  fuel: string;
  transmission: string;
  image: string;
  gallery: string[];
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