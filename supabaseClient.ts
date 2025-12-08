
// ============================================================================
// SUPABASE CLIENT – Versão Robusta (Fail-Safe)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { Car, AppUser, FilterOptions, Seller } from './types';
import { getEnv } from './utils/env';

// ============================================================================
// ENVIRONMENT LOAD & VALIDATION
// ============================================================================

// Busca as chaves usando a função utilitária que checa .env, process.env e o FALLBACK manual
const SUPABASE_URL = getEnv("VITE_SUPABASE_URL");
const SUPABASE_KEY = getEnv("VITE_SUPABASE_ANON_KEY");

const isPlaceholder = !SUPABASE_URL || SUPABASE_URL.includes("placeholder") || !SUPABASE_KEY;

if (isPlaceholder) {
  console.warn("⚠ AVISO: Credenciais do Supabase não detectadas.");
  console.warn("⚠ Para corrigir: Edite o arquivo 'utils/env.ts' e preencha o objeto FALLBACK_ENV com suas chaves.");
} else {
  console.log("✅ Supabase Client conectado:", SUPABASE_URL);
}

// Configuração de URL segura para evitar crash na inicialização do client
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
// TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: any | null;
}

export interface ApiListResponse<T> {
  data: T[];
  error: any | null;
  count?: number | null;
}

// ============================================================================
// AUTH & ADMIN ACTIONS (Novo)
// ============================================================================

export const signIn = async (email: string, password: string): Promise<ApiResponse<any>> => {
  if (isPlaceholder) {
    return { data: null, error: { message: "Modo Demo: Edite utils/env.ts com suas chaves reais." } };
  }
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string): Promise<ApiResponse<any>> => {
  if (isPlaceholder) {
    return { data: null, error: { message: "Modo Demo: Edite utils/env.ts com suas chaves reais." } };
  }
  return supabase.auth.signUp({ email, password });
};

export const signOut = async () => supabase.auth.signOut();

export const updateAuthPassword = async (newPassword: string) =>
  supabase.auth.updateUser({ password: newPassword });

export const adminCreateUser = async (email: string, name: string, role: string) => {
  try {
    if (isPlaceholder) throw new Error("Sem conexão com Supabase");

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
    if (err.message?.includes('Functions') || err.message?.includes('Failed to send') || isPlaceholder) {
       console.warn("Edge Function falhou ou offline. Criando registro local.");
       const fakeId = crypto.randomUUID();
       if (!isPlaceholder) {
         await supabase.from('app_users').insert([{ id: fakeId, email, name, role }]);
       }
       return { data: { id: fakeId }, error: null };
    }
    return { data: null, error: err };
  }
};

export const adminResetPassword = async (userId: string) => {
  try {
    if (isPlaceholder) return { data: null, error: { message: "Offline" } };
    
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

export const adminDeleteUser = async (userId: string) => {
  try {
    if (isPlaceholder) return { data: null, error: { message: "Offline" } };

    const { data, error } = await supabase.functions.invoke('manage-auth-api', {
      body: { action: 'delete_user', userId }
    });
    
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

// Busca carros com suporte a paginação (Infinite Scroll)
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

    // Filtros
    if (filters.make) query = query.eq('make', filters.make);
    if (filters.vehicleType) query = query.eq('vehicleType', filters.vehicleType);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.status) query = query.eq('status', filters.status);
    
    // Filtro de Texto (Busca)
    if (filters.search) {
       // O Supabase tem limitações com OR complexos. 
       // Para busca simples, o ilike resolve.
       query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }

    if (filters.year) {
      query = query.gte('year', Number(filters.year));
    }

    // Ordenação e Paginação
    query = query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    
    if (error) return { data: [], error, count: 0 };
    return { data: data as Car[], error: null, count };

  } catch (err: any) {
    return { data: [], error: err, count: 0 };
  }
};

// Busca separada para Ofertas Especiais (Top descontos)
// Garante que o banner de ofertas sempre tenha dados, independente da página atual da grid
export const fetchSpecialOffers = async (): Promise<Car[]> => {
  if (isPlaceholder) return [];
  
  // Busca carros onde fipeprice > price e status disponível
  const { data } = await supabase
    .from('cars')
    .select('*')
    .eq('status', 'available')
    .gt('fipeprice', 0) // Garante que tem FIPE cadastrada
    .order('created_at', { ascending: false })
    .limit(20); // Pega os 20 mais recentes para filtrar no front os melhores descontos

  return (data as Car[]) || [];
};

export const fetchAvailableBrands = async (vehicleType?: string): Promise<string[]> => {
  // Para filtros, buscamos todos (limitando a 1000 para performance) apenas as marcas
  if (isPlaceholder) return [];
  let query = supabase.from('cars').select('make').eq('status', 'available');
  if (vehicleType) query = query.eq('vehicleType', vehicleType);
  
  const { data } = await query.limit(1000);
  if (!data) return [];
  
  // @ts-ignore
  return [...new Set(data.map(c => c.make))].sort();
};

export const fetchAvailableYears = async (vehicleType?: string): Promise<number[]> => {
  if (isPlaceholder) return [];
  let query = supabase.from('cars').select('year').eq('status', 'available');
  if (vehicleType) query = query.eq('vehicleType', vehicleType);

  const { data } = await query.limit(1000);
  if (!data) return [];
  
  // @ts-ignore
  return [...new Set(data.map(c => Number(c.year)))].sort((a, b) => b - a);
};

// Função auxiliar para remover campos undefined que causam erro no Supabase
const sanitizePayload = (payload: any) => {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value === undefined ? null : value])
  );
};

export const createCar = async (car: Omit<Car, 'id'>) => {
  if (isPlaceholder) return { data: null, error: null };
  const cleanPayload = sanitizePayload(car);
  // @ts-ignore
  const { id, ...payloadWithoutId } = cleanPayload;
  
  const { data, error } = await supabase.from('cars').insert([payloadWithoutId]).select().single();
  return { data, error };
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  if (isPlaceholder) return { data: null, error: null };
  const cleanUpdates = sanitizePayload(updates);
  const { data, error } = await supabase.from('cars').update(cleanUpdates).eq('id', id).select().single();
  return { data, error };
};

export const deleteCar = async (id: string) => {
  if (isPlaceholder) return { data: null, error: null };
  const { error } = await supabase.from('cars').delete().eq('id', id);
  return { data: null, error };
};

export const sellCar = async (
  id: string,
  salesData: { soldPrice: number; soldDate: string; soldBy: string }
) => {
  try {
    if (isPlaceholder) return { data: null, error: null };
    try {
      const { data, error } = await supabase.functions.invoke("sell-car-api", {
        body: { id, ...salesData },
      });
      if (!error) return { data, error: null };
    } catch (e) {}
    return updateCar(id, { status: 'sold', ...salesData });
  } catch (err) {
    return { data: null, error: err };
  }
};

// ============================================================================
// SELLERS & OTHERS (Mantidos iguais)
// ============================================================================

export const fetchSellers = async () => {
  if (isPlaceholder) return { data: [], error: null };
  const { data, error } = await supabase.from('sellers').select('*').order('name');
  return { data: data || [], error };
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  if (isPlaceholder) return { data: null, error: null };
  const { data, error } = await supabase.from('sellers').insert([seller]).select().single();
  return { data, error };
};

export const updateSeller = async (id: string, updates: Partial<Seller>) => {
  if (isPlaceholder) return { data: null, error: null };
  const { data, error } = await supabase.from('sellers').update(updates).eq('id', id).select().single();
  return { data, error };
};

export const deleteSeller = async (id: string) => {
  if (isPlaceholder) return { data: null, error: null };
  const { error } = await supabase.from('sellers').delete().eq('id', id);
  return { data: null, error };
};

export const fetchUsers = async () => {
  if (isPlaceholder) return { data: [], error: null };
  const { data, error } = await supabase.from('app_users').select('*').order('name');
  return { data: data || [], error };
};

export const createUser = async (user: Omit<AppUser, 'id'>) => {
  if (isPlaceholder) return { data: null, error: null };
  const { data, error } = await supabase.from('app_users').insert([user]).select().single();
  return { data, error };
};

export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  if (isPlaceholder) return { data: null, error: null };
  const { data, error } = await supabase.from('app_users').update(updates).eq('id', id).select().single();
  return { data, error };
};

export const deleteUser = async (id: string) => {
  return adminDeleteUser(id);
};

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    if (isPlaceholder) return "https://via.placeholder.com/800x600?text=Demo+Image";

    const ext = file.name.split('.').pop();
    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `${Date.now()}_${cleanName}.${ext}`;
    
    const { error } = await supabase.storage.from('car-images').upload(fileName, file, {
      upsert: false
    });
    
    if (error) {
      console.error("Supabase Storage Error:", error);
      throw error;
    }

    const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
    return data.publicUrl;

  } catch (err) {
    console.error('Upload Failed:', err);
    return null;
  }
};
