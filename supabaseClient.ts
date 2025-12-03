// ============================================================================
// SUPABASE CLIENT
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller } from './types';
import { getEnv } from './utils/env';

// ============================================================================
// ENVIRONMENT LOAD & VALIDATION
// ============================================================================

const envUrl = getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL");
const envKey = getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("SUPABASE_ANON_KEY");

// Validação Crítica
if (!envUrl || !envKey || envUrl.includes('Sua_URL')) {
  const msg = "🔴 ERRO FATAL: Credenciais do Supabase não configuradas.\n\nEdite o arquivo .env e adicione suas chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";
  console.error(msg);
  alert(msg); // Alerta visual para o desenvolvedor
  throw new Error(msg); // Interrompe a execução para não carregar UI quebrada
}

// ============================================================================
// CLIENT
// ============================================================================

export const supabase = createClient(envUrl, envKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Compatibilidade com HashRouter
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: any | null;
}

export interface ApiListResponse<T> {
  data: T[];
  error: any | null;
}

// ============================================================================
// AUTH
// ============================================================================

export const signIn = async (email: string, password: string): Promise<ApiResponse<any>> => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string): Promise<ApiResponse<any>> => {
  return supabase.auth.signUp({ email, password });
};

export const signOut = async () => supabase.auth.signOut();

export const updateAuthPassword = async (newPassword: string) =>
  supabase.auth.updateUser({ password: newPassword });

// ============================================================================
// CARS
// ============================================================================

export const fetchCars = async (
  filters: FilterOptions = {}
): Promise<ApiListResponse<Car>> => {
  try {
    let query = supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.make) query = query.eq('make', filters.make);
    if (filters.vehicleType) query = query.eq('vehicleType', filters.vehicleType);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);

    const { data, error } = await query;
    if (error) return { data: [], error };

    let result = data as Car[];

    if (filters.search) {
      const t = filters.search.toLowerCase();
      result = result.filter(c =>
        c.make.toLowerCase().includes(t) ||
        c.model.toLowerCase().includes(t)
      );
    }

    if (filters.year) {
      result = result.filter(c => c.year >= Number(filters.year));
    }

    return { data: result, error: null };

  } catch (err: any) {
    return { data: [], error: err };
  }
};

// ============================================================================
// FILTER HELPERS
// ============================================================================

export const fetchAvailableBrands = async (vehicleType?: string): Promise<string[]> => {
  const { data, error } = await fetchCars({ vehicleType });
  if (error || !data) return [];
  return [...new Set(data.map(c => c.make))].sort();
};

export const fetchAvailableYears = async (vehicleType?: string): Promise<number[]> => {
  const { data, error } = await fetchCars({ vehicleType });
  if (error || !data) return [];
  return [...new Set(data.map(c => Number(c.year)))].sort((a, b) => b - a);
};

// ============================================================================
// CRUD: CARS
// ============================================================================

export const createCar = async (car: Omit<Car, 'id'>) => {
  const { id, ...clean } = car as any;
  const { data, error } = await supabase.from('cars').insert([clean]).select().single();
  return { data, error };
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  const { data, error } = await supabase.from('cars').update(updates).eq('id', id).select().single();
  return { data, error };
};

export const deleteCar = async (id: string) => {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  return { data: null, error };
};

export const sellCar = async (
  id: string,
  salesData: { soldPrice: number; soldDate: string; soldBy: string }
) => {
  try {
    // Tenta usar Edge Function se disponível
    try {
      const { data, error } = await supabase.functions.invoke("sell-car-api", {
        body: { id, ...salesData },
      });
      if (!error) return { data, error: null };
    } catch (e) {
      // Falha silenciosa da Edge Function, fallback para update direto
    }

    // Fallback: Update direto no banco
    return updateCar(id, { status: 'sold', ...salesData });

  } catch (err) {
    return { data: null, error: err };
  }
};

// ============================================================================
// SELLERS
// ============================================================================

export const fetchSellers = async () => {
  const { data, error } = await supabase.from('sellers').select('*').order('name');
  return { data: data || [], error };
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  const { data, error } = await supabase.from('sellers').insert([seller]).select().single();
  return { data, error };
};

export const updateSeller = async (id: string, updates: Partial<Seller>) => {
  const { data, error } = await supabase.from('sellers').update(updates).eq('id', id).select().single();
  return { data, error };
};

export const deleteSeller = async (id: string) => {
  const { error } = await supabase.from('sellers').delete().eq('id', id);
  return { data: null, error };
};

// ============================================================================
// USERS – Controlado por RLS
// ============================================================================

export const fetchUsers = async () => {
  const { data, error } = await supabase.from('app_users').select('*').order('name');
  return { data: data || [], error };
};

export const createUser = async (user: Omit<AppUser, 'id'>) => {
  const { data, error } = await supabase.from('app_users').insert([user]).select().single();
  return { data, error };
};

export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  const { data, error } = await supabase.from('app_users').update(updates).eq('id', id).select().single();
  return { data, error };
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  return { data: null, error };
};

// ============================================================================
// STORAGE
// ============================================================================

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('car-images').upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
    return data.publicUrl;

  } catch (err) {
    console.error('Upload Error:', err);
    return null;
  }
};