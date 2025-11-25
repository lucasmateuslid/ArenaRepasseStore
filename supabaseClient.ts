import { createClient } from '@supabase/supabase-js';
import { Car, FilterOptions } from './types';

// Configuração do Supabase com suporte a import.meta.env (Padrão Vite)
// Adicionado optional chaining (?.) para evitar erro caso env seja undefined
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dmpmbdveubwjznmyxdml.supabase.co';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcG1iZHZldWJ3anpubXl4ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODg1MTIsImV4cCI6MjA3OTY2NDUxMn0.km57K39yOTo9_5xRdaXfDWSmXJ8ZXBXbWJmXhjnlFCI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type FetchResponse = {
  data: Car[];
  error: string | null;
};

export const fetchCars = async (filters: FilterOptions = {}): Promise<FetchResponse> => {
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
    
    if (filters.search) {
      const searchTerm = filters.search;
      query = query.or(`model.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Erro Supabase:", error);
      return { data: [], error: error.message };
    }

    return { data: data as Car[], error: null };

  } catch (err) {
    console.error("Erro crítico na conexão:", err);
    return { data: [], error: "Falha na conexão com o banco de dados." };
  }
};