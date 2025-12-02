
import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller } from './types';

// --- CONFIGURAÇÃO DE CONEXÃO BLINDADA ---
// Usamos as chaves diretamente para garantir que a conexão funcione em qualquer ambiente (Local/Preview/Prod)
// sem depender de arquivos .env que podem falhar no carregamento.
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
      console.error("Erro Supabase (Cars):", error.message);
      return { data: [], error: error.message };
    }

    return { data: data as Car[], error: null };

  } catch (err: any) {
    console.error("Erro crítico na conexão:", err);
    return { data: [], error: err.message || "Erro de conexão" };
  }
};

export const fetchAvailableBrands = async (vehicleType?: string): Promise<string[]> => {
  try {
    let query = supabase.from('cars').select('make');
    if (vehicleType) query = query.eq('vehicleType', vehicleType);

    const { data, error } = await query;
    if (error || !data) return [];

    const brands = Array.from(new Set(data.map((c: any) => c.make))).sort();
    return brands as string[];
  } catch (e) { return []; }
};

export const fetchAvailableYears = async (vehicleType?: string): Promise<number[]> => {
  try {
    let query = supabase.from('cars').select('year');
    if (vehicleType) query = query.eq('vehicleType', vehicleType);

    const { data, error } = await query;
    if (error || !data) return [];

    const years = Array.from(new Set(data.map((c: any) => Number(c.year)))).sort((a: number, b: number) => b - a);
    return years as number[];
  } catch (e) { return []; }
};

export const createCar = async (car: Omit<Car, 'id'>) => {
  const { data, error } = await supabase.from('cars').insert([car]).select().single();
  return { data, error: error ? { message: error.message } : null };
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  const { id: _, created_at: __, ...cleanUpdates } = updates as any;
  const { data, error } = await supabase.from('cars').update(cleanUpdates).eq('id', id).select().single();
  return { data, error: error ? { message: error.message } : null };
};

export const deleteCar = async (id: string) => {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  return { error: error ? { message: error.message } : null };
};

// --- VENDEDORES ---

export const fetchSellers = async (): Promise<FetchResponse<Seller>> => {
  const { data, error } = await supabase.from('sellers').select('*').order('created_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: data as Seller[], error: null };
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  const { data, error } = await supabase.from('sellers').insert([seller]).select().single();
  return { data, error: error ? { message: error.message } : null };
};

export const updateSeller = async (id: string, updates: Partial<Seller>) => {
  const { data, error } = await supabase.from('sellers').update(updates).eq('id', id).select().single();
  return { data, error: error ? { message: error.message } : null };
};

export const deleteSeller = async (id: string) => {
  const { error } = await supabase.from('sellers').delete().eq('id', id);
  return { error: error ? { message: error.message } : null };
};

// --- USUÁRIOS ---

export const fetchUsers = async (): Promise<FetchResponse<AppUser>> => {
  const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: data as AppUser[], error: null };
};

export const createUser = async (user: Omit<AppUser, 'id'>) => {
  const { data, error } = await supabase.from('app_users').insert([user]).select().single();
  return { data, error: error ? { message: error.message } : null };
};

export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  const { data, error } = await supabase.from('app_users').update(updates).eq('id', id).select().single();
  return { data, error: error ? { message: error.message } : null };
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  return { error: error ? { message: error.message } : null };
};

// --- STORAGE (UPLOAD) ---

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
};

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const cleanName = sanitizeFileName(file.name.split('.').slice(0, -1).join('.'));
    const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      const errStr = JSON.stringify(uploadError);
      if (errStr.includes('recursion') || errStr.includes('policy')) {
         throw new Error("Erro de Permissão (Recursion/Policy). Rode o SQL de correção no painel do Supabase.");
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error: any) {
    console.error("Upload Error:", error);
    throw new Error(error.message || "Falha no upload");
  }
};
