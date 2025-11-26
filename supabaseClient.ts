
import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller } from './types';

// Configuração do Supabase com fallback explícito para garantir funcionamento
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dmpmbdveubwjznmyxdml.supabase.co';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcG1iZHZldWJ3anpubXl4ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODg1MTIsImV4cCI6MjA3OTY2NDUxMn0.km57K39yOTo9_5xRdaXfDWSmXJ8ZXBXbWJmXhjnlFCI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type FetchResponse<T> = {
  data: T[];
  error: string | null;
};

// --- AUTH ---

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- CARROS ---

export const fetchCars = async (filters: FilterOptions = {}): Promise<FetchResponse<Car>> => {
  try {
    let query = supabase.from('cars').select('*');

    if (filters.make) {
      query = query.eq('make', filters.make);
    }
    
    if (filters.year) {
      query = query.gte('year', Number(filters.year));
    }
    
    if (filters.maxPrice) {
      query = query.lte('price', Number(filters.maxPrice));
    }

    if (filters.vehicleType) {
      query = query.eq('vehicleType', filters.vehicleType);
    }
    
    if (filters.search) {
      const searchTerm = filters.search;
      query = query.or(`model.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message || JSON.stringify(error) };
    }

    return { data: data as Car[], error: null };

  } catch (err: any) {
    console.error("Erro crítico na conexão:", err);
    return { data: [], error: err.message || "Falha na conexão com o banco de dados." };
  }
};

export const fetchAvailableBrands = async (vehicleType?: string): Promise<string[]> => {
  try {
    let query = supabase.from('cars').select('make');
    
    if (vehicleType) {
      query = query.eq('vehicleType', vehicleType);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    // Retorna apenas marcas únicas ordenadas alfabeticamente
    const brands = Array.from(new Set(data.map((c: any) => c.make))).sort();
    return brands as string[];
  } catch (e) {
    console.error("Erro ao buscar marcas:", e);
    return [];
  }
};

export const createCar = async (car: Omit<Car, 'id'>) => {
  const { data, error } = await supabase
    .from('cars')
    .insert([car])
    .select()
    .single();
  
  return { data, error };
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  const { id: _, created_at: __, ...cleanUpdates } = updates as any;

  const { data, error } = await supabase
    .from('cars')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteCar = async (id: string) => {
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id);

  return { error };
};

// --- VENDEDORES (sellers) ---

export const fetchSellers = async (): Promise<FetchResponse<Seller>> => {
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('active', true);

  if (error) return { data: [], error: error.message };
  return { data: data as Seller[], error: null };
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  const { data, error } = await supabase
    .from('sellers')
    .insert([seller])
    .select()
    .single();
  return { data, error };
};

export const deleteSeller = async (id: string) => {
  const { error } = await supabase
    .from('sellers')
    .delete()
    .eq('id', id);
  return { error };
};


// --- USUÁRIOS (app_users) ---

export const fetchUsers = async (): Promise<FetchResponse<AppUser>> => {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data as AppUser[], error: null };
};

export const createUser = async (user: Omit<AppUser, 'id'>) => {
  const { data, error } = await supabase
    .from('app_users')
    .insert([user])
    .select()
    .single();
  return { data, error };
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', id);
  return { error };
};

// --- STORAGE ---

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Erro no upload:", error);
    return null;
  }
};