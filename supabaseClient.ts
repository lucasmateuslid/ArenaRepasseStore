
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

// Helper para invocar funções com tratamento de erro padrão
const invokeEdgeFunction = async <T>(
  functionName: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
  body?: any,
  queryParams?: Record<string, string>
): Promise<{ data: T | null, error: any }> => {
  try {
    const options: any = {
      method,
      headers: {
        // O Supabase JS SDK já anexa o Authorization Bearer automaticamente se o usuário estiver logado
      }
    };

    if (body && method !== 'GET') {
      options.body = body;
    }

    // Monta Query String para GET
    let urlSuffix = '';
    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      urlSuffix = `?${params.toString()}`;
    }

    // A chamada 'invoke' envia o token do usuário atual automaticamente
    const { data, error } = await supabase.functions.invoke(`${functionName}${urlSuffix}`, options);

    if (error) {
      console.error(`Erro na Edge Function [${functionName}]:`, error);
      return { data: null, error: error.message || error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error(`Exceção ao chamar [${functionName}]:`, err);
    return { data: null, error: err.message };
  }
};

// --- AUTH (Mantém direto via SDK Client pois é seguro e padrão) ---

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

// --- CARROS (Via Edge Function: cars-api) ---

export const fetchCars = async (filters: FilterOptions = {}): Promise<FetchResponse<Car>> => {
  // Converter filtros para query params simples
  const params: Record<string, string> = {};
  if (filters.make) params.make = filters.make;
  if (filters.vehicleType) params.vehicleType = filters.vehicleType;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  // Nota: Filtros complexos como 'search' (LIKE) ou 'year' (GTE) devem ser implementados na lógica da Edge Function.
  // Neste exemplo básico, passamos o que a API suporta.
  
  const { data, error } = await invokeEdgeFunction<Car[]>('cars-api', 'GET', undefined, params);
  
  if (error) return { data: [], error };
  
  // Filtragem extra no cliente caso a API não suporte todos os filtros ainda (ex: busca textual complexa)
  let result = data || [];
  if (filters.search) {
     const t = filters.search.toLowerCase();
     result = result.filter(c => c.model.toLowerCase().includes(t) || c.make.toLowerCase().includes(t));
  }
  if (filters.year) {
     result = result.filter(c => c.year >= Number(filters.year));
  }

  return { data: result, error: null };
};

// Helpers de filtro visual mantidos localmente ou movidos para API se desejar
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
  return await invokeEdgeFunction('cars-api', 'POST', car);
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  // A API espera um PUT com ID na URL ou body. Vamos passar na URL query param.
  return await invokeEdgeFunction('cars-api', 'PUT', updates, { id });
};

export const deleteCar = async (id: string) => {
  return await invokeEdgeFunction('cars-api', 'DELETE', undefined, { id });
};

// --- VENDEDORES (Via Edge Function: sellers-api) ---

export const fetchSellers = async (): Promise<FetchResponse<Seller>> => {
  const { data, error } = await invokeEdgeFunction<Seller[]>('sellers-api', 'GET');
  return { data: data || [], error };
};

export const createSeller = async (seller: Omit<Seller, 'id'>) => {
  return await invokeEdgeFunction('sellers-api', 'POST', seller);
};

export const updateSeller = async (id: string, updates: Partial<Seller>) => {
  return await invokeEdgeFunction('sellers-api', 'PUT', updates, { id });
};

export const deleteSeller = async (id: string) => {
  return await invokeEdgeFunction('sellers-api', 'DELETE', undefined, { id });
};

// --- USUÁRIOS (Via Edge Function: users-api) ---

export const fetchUsers = async (): Promise<FetchResponse<AppUser>> => {
  const { data, error } = await invokeEdgeFunction<AppUser[]>('users-api', 'GET');
  return { data: data || [], error };
};

export const createUser = async (user: Omit<AppUser, 'id'>) => {
  return await invokeEdgeFunction('users-api', 'POST', user);
};

export const updateUser = async (id: string, updates: Partial<AppUser>) => {
  return await invokeEdgeFunction('users-api', 'PUT', updates, { id });
};

export const deleteUser = async (id: string) => {
  return await invokeEdgeFunction('users-api', 'DELETE', undefined, { id });
};

// --- STORAGE (Via Edge Function: upload-api) ---

export const uploadCarImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data, error } = await supabase.functions.invoke('upload-api', {
      method: 'POST',
      body: formData, // Supabase Client lida com o Content-Type multipart automaticamente
    });

    if (error) throw error;
    if (!data?.url) throw new Error("URL não retornada pela API");

    return data.url;
  } catch (error: any) {
    console.error("Upload Error (Edge):", error);
    throw new Error(error.message || "Falha no upload via Edge Function");
  }
};
