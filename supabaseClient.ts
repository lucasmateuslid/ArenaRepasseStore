import { createClient } from '@supabase/supabase-js';
import { MOCK_CARS } from './constants';
import { Car } from './types';

// NOTE: These should be in process.env in a real build.
// Use your project URL and Anon Key from Supabase Dashboard.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

/**
 * Fetches cars from Supabase if configured, otherwise returns Mock data.
 */
export const fetchCars = async (): Promise<Car[]> => {
  if (!supabase) {
    console.log('Supabase not configured, using mock data.');
    return new Promise((resolve) => {
      // Simulate network latency for realistic feel
      setTimeout(() => resolve(MOCK_CARS), 600);
    });
  }

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*');

    if (error) throw error;
    return data as Car[] || [];
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    return MOCK_CARS; // Fallback
  }
};
