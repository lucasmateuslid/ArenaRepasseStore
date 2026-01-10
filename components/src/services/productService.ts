import { Car } from "../../../types";

// Service deprecated: The application now uses Supabase (see supabaseClient.ts).
// These stubs prevent TypeScript errors in legacy components.

export const getProducts = async (): Promise<Car[]> => {
  console.warn("ProductService (Firebase) is deprecated. Use supabaseClient.");
  return [];
};

export const addProduct = async (car: Omit<Car, 'id'>): Promise<string> => {
  throw new Error("ProductService is deprecated. Use Supabase.");
};

export const updateProduct = async (id: string, updates: Partial<Car>): Promise<void> => {
  throw new Error("ProductService is deprecated. Use Supabase.");
};

export const deleteProduct = async (id: string): Promise<void> => {
  throw new Error("ProductService is deprecated. Use Supabase.");
};

export const uploadImage = async (file: File): Promise<string> => {
  throw new Error("ProductService is deprecated. Use Supabase.");
};
