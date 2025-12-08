
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CompanySettings } from '../types';
import { fetchCompanySettings, updateCompanySettings } from '../supabaseClient';

interface CompanyContextType {
  settings: CompanySettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<{ error: any }>;
}

const CompanyContext = createContext<CompanyContextType>({
  settings: null,
  loading: true,
  refreshSettings: async () => {},
  updateSettings: async () => ({ error: null }),
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    const data = await fetchCompanySettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const update = async (newSettings: Partial<CompanySettings>) => {
    const { error } = await updateCompanySettings(newSettings);
    if (!error) {
      await loadSettings();
    }
    return { error };
  };

  return (
    <CompanyContext.Provider value={{ settings, loading, refreshSettings: loadSettings, updateSettings: update }}>
      {children}
    </CompanyContext.Provider>
  );
};
