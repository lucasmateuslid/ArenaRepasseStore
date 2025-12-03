
import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller } from './types';

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = 'https://dmpmbdveubwjznmyxdml.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcG1iZHZldWJ3anpubXl4ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODg1MTIsImV4cCI6MjA3OTY2NDUxMn0.km57K39yOTo9_5xRdaXfDWSmXJ8ZXBXbWJmXhjnlFCI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

type FetchResponse<T> = {
  data: T[];
  error: any;
};

// --- AUTH ---

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const updateAuthPassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
};

// --- CARROS ---

export const fetchCars = async (filters: FilterOptions = {}): Promise<FetchResponse<Car>> => {
  try {
    let query = supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.make) {
      query = query.eq('make', filters.make);
    }
    if (filters.vehicleType) {
      query = query.eq('vehicleType', filters.vehicleType);
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cars:', error);
      return { data: [], error };
    }

    let result = data as Car[];

    // Filtros de texto e ano (client-side por enquanto, ou poderiam ser DB)
    if (filters.search) {
      const t = filters.search.toLowerCase();
      result = result.filter(c => 
        c.model.toLowerCase().includes(t) || 
        c.make.toLowerCase().includes(t)
      );
    }
    if (filters.year) {
      result = result.filter(c => c.year >= Number(filters.year));
    }

    return { data: result, error: null };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
};

export const fetchAvailableBrands = async (vehicleType?: string): Promise<string[]> => {
  const { data } = await fetchCars({ vehicleType });
  if (!data) return [];
  return Array.from(new Set(data.map((c: any) => c.make))).sort();
};

export const fetchAvailableYears = async (vehicleType?: string): Promise<number[]> => {
  const { data } = await fetchCars({ vehicleType });
  if (!data) return [];
  return Array.from(new Set(data.map((c: any) => Number(c.year)))).sort((a: number, b: number) => b - a);
};

export const createCar = async (car: Omit<Car, 'id'>) => {
  const { data, error } = await supabase.from('cars').insert([car]).select();
  return { data, error };
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  const { data, error } = await supabase.from('cars').update(updates).eq('id', id).select();
  return { data, error };
};

export const deleteCar = async (id: string) => {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  return { error };
};

/**
 * Registra a venda de um carro usando a Edge Function 'sell-car-api'.
 * Se a Edge Function não estiver deployada, você pode substituir o conteúdo
 * pelo método direto: supabase.from('cars').update({...}).eq('id', id)
 */
export const sellCar = async (id: string, salesData: { soldPrice: number, soldDate: string, soldBy: string }) => {
  try {
    const { data, error } = await supabase.functions.invoke('sell-car-api', {
      body: { id, ...salesData }
    });
    
    // Fallback para conexão direta se a Edge Function falhar no preview
    if (error) {
       console.warn("Edge Function falhou (possivelmente preview), tentando acesso direto ao DB...", error);
       return await supabase.from('cars').update({ status: 'sold', ...salesData }).eq('id', id).select();
    }
    
    return { data, error };
  } catch (err: any) {
    // Fallback de segurança
    return await supabase.from('cars').update({ status: 'sold', ...salesData }).eq('id', id).select();
  }
};

// --- VENDEDORES ---

export const fetchSellers = async (): Promise<FetchResponse<Seller>> => {
  const { data, error } = await supabase.from('sellers').select('*').order('name');
  return { data: data || [], error };
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  const { data, error } = await supabase.from('sellers').insert([seller]).select();
  return { data, error };
};

export const updateSeller = async (id: string, updates: Partial<Seller>) => {
  const { data, error } = await supabase.from('sellers').update(updates).eq('id', id).select();
  return { data, error };
};

export const deleteSeller = async (id: string) => {
  const { error } = await supabase.from('sellers').delete().eq('id', id);
  return { error };
};

// --- USUÁRIOS ---

export const fetchUsers = async (): Promise<FetchResponse<AppUser>> => {
  const { data, error } = await supabase.from('app_users').select('*').order('name');
  return { data: data || [], error };
};

export const createUser = async (user: Omit<AppUser, 'id'>) => {
  const { data, error } = await supabase.from('app_users').insert([user]).select();
  return { data, error };
};

export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  const { data, error } = await supabase.from('app_users').update(updates).eq('id', id).select();
  return { data, error };
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  return { error };
};

// --- UPLOAD ---

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('car-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error: any) {
    console.error("Upload Error:", error);
    return null;
  }
};
