
// ============================================================================
// SUPABASE CLIENT – Versão Robusta (Fail-Safe)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller, CompanySettings } from './types';
import { getEnv } from './utils/env';

// ============================================================================
// ENVIRONMENT LOAD & VALIDATION
// ============================================================================

const SUPABASE_URL = getEnv("VITE_SUPABASE_URL");
const SUPABASE_KEY = getEnv("VITE_SUPABASE_ANON_KEY");

const isPlaceholder = !SUPABASE_URL || SUPABASE_URL.includes("placeholder") || !SUPABASE_KEY;

if (isPlaceholder) {
  console.warn("⚠ AVISO: Credenciais do Supabase não detectadas.");
} else {
  console.log("✅ Supabase Client configurado:", SUPABASE_URL);
}

const clientUrl = isPlaceholder ? "https://placeholder.supabase.co" : SUPABASE_URL;
const clientKey = isPlaceholder ? "placeholder-key" : SUPABASE_KEY;

// ============================================================================
// CLIENT
// ============================================================================

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, 
  },
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrai uma string de erro legível de qualquer objeto de erro retornado pelo Supabase ou Catch.
 */
export const parseError = (error: any): string => {
  if (!error) return "Erro desconhecido";
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
  error: string | null;
  count?: number | null;
}

// ============================================================================
// AUTH & ADMIN ACTIONS
// ============================================================================

export const signIn = async (email: string, password: string): Promise<ApiResponse<any>> => {
  if (isPlaceholder) {
    return { data: null, error: "Modo Demo: Configure suas chaves reais no Supabase." };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const signUp = async (email: string, password: string): Promise<ApiResponse<any>> => {
  if (isPlaceholder) {
    return { data: null, error: "Modo Demo: Configure suas chaves reais no Supabase." };
  }
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const signOut = async () => supabase.auth.signOut();

export const updateAuthPassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? parseError(error) : null };
  } catch (err) {
    return { error: parseError(err) };
  }
};

export const adminCreateUser = async (email: string, name: string, role: string) => {
  try {
    if (isPlaceholder) throw new Error("Sem conexão com Supabase");

    const { data, error } = await supabase.functions.invoke('manage-auth-api', {
      body: { 
        action: 'create_user', 
        email, 
        password: '123456', 
        userData: { fullName: name, role }
      }
    });
    
    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return { data, error: null };
  } catch (err: any) {
    console.error("Falha na criação administrativa:", err);
    if (!isPlaceholder) {
      try {
        const fakeId = crypto.randomUUID();
        await supabase.from('app_users').insert([{ 
          id: fakeId, 
          email, 
          name, 
          role,
          is_approved: true 
        }]);
        return { data: { id: fakeId }, error: null };
      } catch (dbErr) {
        return { data: null, error: parseError(dbErr) };
      }
    }
    return { data: null, error: parseError(err) };
  }
};

// ============================================================================
// CARS
// ============================================================================

export const fetchCars = async (
  filters: FilterOptions = {},
  page: number = 0,
  limit: number = 12
): Promise<ApiListResponse<Car>> => {
  try {
    if (isPlaceholder) return { data: [], error: null };

    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' });

    if (filters.make) query = query.eq('make', filters.make);
    if (filters.vehicleType) query = query.eq('vehicleType', filters.vehicleType);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.status) query = query.eq('status', filters.status);
    
    if (filters.search) {
       query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }

    if (filters.year) {
      query = query.gte('year', Number(filters.year));
    }

    query = query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    
    if (error) return { data: [], error: parseError(error), count: 0 };
    return { data: data as Car[], error: null, count };

  } catch (err: any) {
    return { data: [], error: parseError(err), count: 0 };
  }
};

export const fetchSpecialOffers = async (): Promise<Car[]> => {
  if (isPlaceholder) return [];
  try {
    const { data } = await supabase
      .from('cars')
      .select('*')
      .eq('status', 'available')
      .gt('fipeprice', 0)
      .order('created_at', { ascending: false })
      .limit(20);
    return (data as Car[]) || [];
  } catch {
    return [];
  }
};

export const fetchAvailableBrands = async (vehicleType?: string): Promise<string[]> => {
  if (isPlaceholder) return [];
  try {
    let query = supabase.from('cars').select('make').eq('status', 'available');
    if (vehicleType) query = query.eq('vehicleType', vehicleType);
    
    const { data } = await query.limit(1000);
    if (!data) return [];
    
    // Explicitly cast mapped result to strings to fix TypeScript unknown array error
    const brands: string[] = data.map((c: any) => String(c.make));
    // Fix: Explicitly cast Array.from result to string[] to resolve TypeScript unknown[] inference error.
    return (Array.from(new Set(brands)) as string[]).sort();
  } catch {
    return [];
  }
};

export const fetchAvailableYears = async (vehicleType?: string): Promise<number[]> => {
  if (isPlaceholder) return [];
  try {
    let query = supabase.from('cars').select('year').eq('status', 'available');
    if (vehicleType) query = query.eq('vehicleType', vehicleType);

    const { data } = await query.limit(1000);
    if (!data) return [];
    
    // Explicitly cast mapped result to numbers to fix TypeScript arithmetic and unknown array errors
    const years: number[] = data.map((c: any) => Number(c.year));
    // Fix: Explicitly cast Array.from result and define sort parameters as numbers to resolve arithmetic and unknown[] errors.
    return (Array.from(new Set(years)) as number[]).sort((a: number, b: number) => b - a);
  } catch {
    return [];
  }
};

const sanitizePayload = (payload: any) => {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value === undefined ? null : value])
  );
};

export const createCar = async (car: Omit<Car, 'id'>) => {
  if (isPlaceholder) return { data: null, error: null };
  try {
    const cleanPayload = sanitizePayload(car);
    const { data, error } = await supabase.from('cars').insert([cleanPayload]).select().single();
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  if (isPlaceholder) return { data: null, error: null };
  try {
    const cleanUpdates = sanitizePayload(updates);
    const { data, error } = await supabase.from('cars').update(cleanUpdates).eq('id', id).select().single();
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const deleteCar = async (id: string) => {
  if (isPlaceholder) return { data: null, error: null };
  try {
    const { error } = await supabase.from('cars').delete().eq('id', id);
    return { data: null, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const sellCar = async (
  id: string,
  salesData: { soldPrice: number; soldDate: string; soldBy: string }
) => {
  try {
    if (isPlaceholder) return { data: null, error: null };
    const { data, error } = await supabase.from('cars')
      .update({ status: 'sold', ...salesData })
      .eq('id', id)
      .select()
      .single();
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

// ============================================================================
// SELLERS & OTHERS
// ============================================================================

export const fetchSellers = async () => {
  if (isPlaceholder) return { data: [], error: null };
  try {
    const { data, error } = await supabase.from('sellers').select('*').order('name');
    return { data: data || [], error: error ? parseError(error) : null };
  } catch (err) {
    return { data: [], error: parseError(err) };
  }
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  if (isPlaceholder) return { data: null, error: null };
  try {
    const { data, error } = await supabase.from('sellers').insert([seller]).select().single();
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const updateSeller = async (id: string, updates: Partial<Seller>) => {
  if (isPlaceholder) return { data: null, error: null };
  try {
    const { data, error } = await supabase.from('sellers').update(updates).eq('id', id).select().single();
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const deleteSeller = async (id: string) => {
  if (isPlaceholder) return { data: null, error: null };
  try {
    const { error } = await supabase.from('sellers').delete().eq('id', id);
    return { data: null, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const fetchUsers = async () => {
  if (isPlaceholder) return { data: [], error: null };
  try {
    const { data, error } = await supabase.from('app_users').select('*').order('name');
    return { data: data || [], error: error ? parseError(error) : null };
  } catch (err) {
    return { data: [], error: parseError(err) };
  }
};

// Fix missing export error for updateUser used in PeopleView
export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  if (isPlaceholder) return { data: null, error: "Modo Demo" };
  try {
    const { data, error } = await supabase.from('app_users').update(updates).eq('id', id).select().single();
    return { data, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

// Fix missing export error for adminResetPassword used in Admin page
export const adminResetPassword = async (userId: string, newPassword: string = '123456') => {
  try {
    if (isPlaceholder) throw new Error("Sem conexão com Supabase");

    const { data, error } = await supabase.functions.invoke('manage-auth-api', {
      body: { 
        action: 'reset_password', 
        userId, 
        password: newPassword
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: parseError(err) };
  }
};

export const deleteUser = async (id: string) => {
  if (isPlaceholder) return { data: null, error: null };
  try {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    return { data: null, error: error ? parseError(error) : null };
  } catch (err) {
    return { data: null, error: parseError(err) };
  }
};

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    if (isPlaceholder) return "https://via.placeholder.com/800x600?text=Demo+Image";

    const ext = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `${Date.now()}_${cleanName}.${ext}`;
    
    const { error } = await supabase.storage.from('car-images').upload(fileName, file, {
      upsert: false
    });
    
    if (error) throw error;

    const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
    return data.publicUrl;

  } catch (err) {
    console.error('Upload Failed:', parseError(err));
    return null;
  }
};

// ============================================================================
// COMPANY SETTINGS (SINGLETON)
// ============================================================================

export const fetchCompanySettings = async (): Promise<CompanySettings> => {
  const defaultSettings: CompanySettings = {
    company_name: 'Arena Repasse',
    cnpj: '00.000.000/0001-91',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    phone_whatsapp: '5511999999999',
    email: 'contato@arenarepasse.com.br',
    opening_hours: 'Seg a Sex: 09h às 18h\nSáb: 09h às 13h'
  };

  if (isPlaceholder) return defaultSettings;

  try {
    const { data, error } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();
    
    if (error) {
      console.warn("Erro ao buscar configurações (esperado se tabela não existe):", parseError(error));
      return defaultSettings;
    }
    
    return data || defaultSettings;
  } catch (err: any) {
    console.error("Exceção de rede ao buscar configurações:", parseError(err));
    return defaultSettings;
  }
};

export const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
  if (isPlaceholder) return { data: null, error: "Modo Demo" };

  try {
    const { data: current } = await supabase.from('company_settings').select('id').limit(1).maybeSingle();
    
    if (current?.id) {
       const { data, error } = await supabase.from('company_settings').update(settings).eq('id', current.id).select().single();
       return { data, error: error ? parseError(error) : null };
    } else {
       const { data, error } = await supabase.from('company_settings').insert([settings]).select().single();
       return { data, error: error ? parseError(error) : null };
    }
  } catch (err: any) {
    return { data: null, error: parseError(err) };
  }
};
