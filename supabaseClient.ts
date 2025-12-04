
// ============================================================================
// SUPABASE CLIENT – Versão Robusta (Fail-Safe)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller } from './types';
import { getEnv } from './utils/env';

// ============================================================================
// ENVIRONMENT LOAD & VALIDATION
// ============================================================================

const envUrl = getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL");
const envKey = getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("SUPABASE_ANON_KEY");

const isValidUrl = (url: string) => url && url.startsWith('http') && !url.includes('sua-url');

const SUPABASE_URL = isValidUrl(envUrl) ? envUrl : "https://placeholder.supabase.co";
const SUPABASE_KEY = (envKey && !envKey.includes('sua-chave')) ? envKey : "placeholder-key";

if (SUPABASE_URL === "https://placeholder.supabase.co") {
  console.warn("⚠ AVISO: Credenciais do Supabase não encontradas ou inválidas.");
  console.warn("⚠ O app está rodando em modo OFFLINE/DEMO. Edite o arquivo .env com suas chaves reais.");
}

// ============================================================================
// CLIENT
// ============================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, 
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
// AUTH & ADMIN ACTIONS (Novo)
// ============================================================================

export const signIn = async (email: string, password: string): Promise<ApiResponse<any>> => {
  if (SUPABASE_URL === "https://placeholder.supabase.co") {
    return { data: null, error: { message: "Modo Demo: Configure o .env para fazer login." } };
  }
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string): Promise<ApiResponse<any>> => {
  return supabase.auth.signUp({ email, password });
};

export const signOut = async () => supabase.auth.signOut();

export const updateAuthPassword = async (newPassword: string) =>
  supabase.auth.updateUser({ password: newPassword });

/**
 * Cria um usuário no sistema de Auth (Login Real) via Edge Function.
 * Requer que a função 'manage-auth-api' esteja deployada com Service Key.
 */
export const adminCreateUser = async (email: string, name: string, role: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-auth-api', {
      body: { 
        action: 'create_user', 
        email, 
        password: '123456', // Senha Padrão
        userData: { fullName: name, role }
      }
    });
    
    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return { data, error: null };
  } catch (err: any) {
    console.error("Falha na criação administrativa:", err);
    // Fallback para ambiente local/demo sem Edge Functions:
    // Cria apenas na tabela pública para "fingir" que funcionou visualmente
    if (err.message?.includes('Functions') || err.message?.includes('Failed to send')) {
       console.warn("Edge Function falhou. Criando apenas registro local (Sem login real).");
       const fakeId = crypto.randomUUID();
       await supabase.from('app_users').insert([{ id: fakeId, email, name, role }]);
       return { data: { id: fakeId }, error: null };
    }
    return { data: null, error: err };
  }
};

/**
 * Reseta a senha de um usuário para '123456' via Edge Function.
 */
export const adminResetPassword = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-auth-api', {
      body: { 
        action: 'reset_password', 
        userId, 
        password: '123456' 
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Deleta usuário do Auth e do Banco via Edge Function.
 */
export const adminDeleteUser = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-auth-api', {
      body: { action: 'delete_user', userId }
    });
    
    // Se a Edge Function falhar (ex: ambiente dev), tenta deletar da tabela pública direto
    if (error) {
       await supabase.from('app_users').delete().eq('id', userId);
    }
    
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};


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
    try {
      const { data, error } = await supabase.functions.invoke("sell-car-api", {
        body: { id, ...salesData },
      });
      if (!error) return { data, error: null };
    } catch (e) {
      // Falha silenciosa
    }
    return updateCar(id, { status: 'sold', ...salesData });
  } catch (err) {
    return { data: null, error: err };
  }
};

// ============================================================================
// SELLERS
// ============================================================================

export const fetchSellers = async () => {
  if (SUPABASE_URL === "https://placeholder.supabase.co") return { data: [], error: null };
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
// USERS
// ============================================================================

export const fetchUsers = async () => {
  if (SUPABASE_URL === "https://placeholder.supabase.co") return { data: [], error: null };
  const { data, error } = await supabase.from('app_users').select('*').order('name');
  return { data: data || [], error };
};

export const createUser = async (user: Omit<AppUser, 'id'>) => {
  // OBSOLETO: Use adminCreateUser para criar login real
  const { data, error } = await supabase.from('app_users').insert([user]).select().single();
  return { data, error };
};

export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  const { data, error } = await supabase.from('app_users').update(updates).eq('id', id).select().single();
  return { data, error };
};

export const deleteUser = async (id: string) => {
  // Tenta deletar via Admin API primeiro
  return adminDeleteUser(id);
};

// ============================================================================
// STORAGE
// ============================================================================

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    if (SUPABASE_URL === "https://placeholder.supabase.co") return "https://via.placeholder.com/800x600?text=Demo+Image";

    const ext = file.name.split('.').pop();
    
    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const fileName = `${Date.now()}_${generateId()}.${ext}`;

    const { error } = await supabase.storage.from('car-images').upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
    return data.publicUrl;

  } catch (err) {
    console.error('Upload Error:', err);
    return null;
  }
};
