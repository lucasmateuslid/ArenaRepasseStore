
import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller, CompanySettings } from './types';
import { getEnv } from './utils/env';

const SUPABASE_URL = getEnv("VITE_SUPABASE_URL");
const SUPABASE_KEY = getEnv("VITE_SUPABASE_ANON_KEY");

const isPlaceholder = !SUPABASE_URL || SUPABASE_URL.includes("placeholder") || !SUPABASE_KEY;

export const supabase = createClient(
  isPlaceholder ? "https://placeholder.supabase.co" : SUPABASE_URL,
  isPlaceholder ? "placeholder-key" : SUPABASE_KEY
);

export const parseError = (error: any): string => {
  if (!error) return "Erro desconhecido";
  if (typeof error === 'string') return error;
  return error.message || String(error);
};

export interface ApiListResponse<T> {
  data: T[];
  error: string | null;
  count?: number | null;
}

// AUTH
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error: error ? parseError(error) : null };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error: error ? parseError(error) : null };
};

export const signOut = async () => supabase.auth.signOut();

// Added updateAuthPassword export for ProfileView
export const updateAuthPassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password });
  return { data, error: error ? parseError(error) : null };
};

// CARS
export const fetchCars = async (
  filters: FilterOptions = {},
  page: number = 0,
  limit: number = 12
): Promise<ApiListResponse<Car>> => {
  try {
    if (isPlaceholder) return { data: [], error: null };

    let query = supabase.from('cars').select('*', { count: 'exact' });

    if (filters.vehicleType) query = query.eq('vehicleType', filters.vehicleType);
    if (filters.make) query = query.eq('make', filters.make);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.year) query = query.gte('year', Number(filters.year));
    
    if (filters.search) {
       query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    return { data: (data as Car[]) || [], error: error ? parseError(error) : null, count };
  } catch (err) {
    return { data: [], error: parseError(err), count: 0 };
  }
};

export const fetchAvailableBrands = async (vehicleType?: string): Promise<string[]> => {
  if (isPlaceholder) return [];
  try {
    let query = supabase.from('cars').select('make').eq('status', 'available');
    if (vehicleType) query = query.eq('vehicleType', vehicleType);
    
    const { data } = await query;
    if (!data) return [];
    // Fix: Explicitly type mapping result and cast Array.from to string[] to avoid unknown[] error
    const brands: string[] = data.map((c: any) => String(c.make));
    return Array.from(new Set(brands)).sort() as string[];
  } catch { return []; }
};

export const fetchAvailableYears = async (vehicleType?: string): Promise<number[]> => {
  if (isPlaceholder) return [];
  try {
    let query = supabase.from('cars').select('year').eq('status', 'available');
    if (vehicleType) query = query.eq('vehicleType', vehicleType);

    const { data } = await query;
    if (!data) return [];
    // Fix: Explicitly type mapping result and provide typed sort function to avoid unknown[] error
    const years: number[] = data.map((c: any) => Number(c.year));
    return Array.from(new Set(years)).sort((a: number, b: number) => b - a) as number[];
  } catch { return []; }
};

export const createCar = async (car: Omit<Car, 'id'>) => {
  const { data, error } = await supabase.from('cars').insert([car]).select().single();
  return { data, error: error ? parseError(error) : null };
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  const { data, error } = await supabase.from('cars').update(updates).eq('id', id).select().single();
  return { data, error: error ? parseError(error) : null };
};

// Added sellCar export for Admin view to interact with sell-car-api Edge Function
export const sellCar = async (id: string, soldPrice: number, soldDate: string, soldBy: string) => {
  const { data, error } = await supabase.functions.invoke('sell-car-api', {
    body: { id, soldPrice, soldDate, soldBy }
  });
  return { data, error: error ? parseError(error) : null };
};

export const deleteCar = async (id: string) => {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  return { error: error ? parseError(error) : null };
};

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    if (isPlaceholder) return "https://via.placeholder.com/800x600?text=Arena+Repasse";
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const { error } = await supabase.storage.from('car-images').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch { return null; }
};

// SETTINGS
export const fetchCompanySettings = async (): Promise<CompanySettings> => {
  const def: CompanySettings = {
    company_name: 'Arena Repasse',
    cnpj: '55.915.981/0001-99',
    address: 'Av. Prudente de Morais, 4892 - Natal, RN',
    phone_whatsapp: '84996697575',
    email: 'contato@arenarepasse.com.br',
    opening_hours: 'Seg a Sex: 09h às 18h\nSáb: 09h às 13h'
  };
  if (isPlaceholder) return def;
  try {
    const { data } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();
    return data || def;
  } catch { return def; }
};

export const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
  const { data: current } = await supabase.from('company_settings').select('id').maybeSingle();
  if (current?.id) {
    return supabase.from('company_settings').update(settings).eq('id', current.id);
  }
  return supabase.from('company_settings').insert([settings]);
};

// PEOPLE
export const fetchSellers = async () => {
  const { data, error } = await supabase.from('sellers').select('*').order('name');
  return { data: data || [], error: error ? parseError(error) : null };
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  return supabase.from('sellers').insert([seller]).select().single();
};

// Added updateSeller export for People management in Admin view
export const updateSeller = async (id: string, updates: Partial<Seller>) => {
  const { data, error } = await supabase.from('sellers').update(updates).eq('id', id).select().single();
  return { data, error: error ? parseError(error) : null };
};

export const deleteSeller = async (id: string) => {
  return supabase.from('sellers').delete().eq('id', id);
};

export const fetchUsers = async () => {
  const { data, error } = await supabase.from('app_users').select('*').order('name');
  return { data: data || [], error: error ? parseError(error) : null };
};

export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  return supabase.from('app_users').update(updates).eq('id', id).select().single();
};

export const deleteUser = async (id: string) => {
  return supabase.from('app_users').delete().eq('id', id);
};

export const adminCreateUser = async (email: string, name: string, role: string) => {
  return supabase.functions.invoke('manage-auth-api', {
    body: { action: 'create_user', email, password: '123456', userData: { fullName: name, role } }
  });
};

export const adminResetPassword = async (userId: string) => {
  return supabase.functions.invoke('manage-auth-api', {
    body: { action: 'reset_password', userId, password: '123456' }
  });
};
