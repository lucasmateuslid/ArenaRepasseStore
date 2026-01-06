// ============================================================================
// getEnv: Recuperação segura de variáveis de ambiente otimizada para Vite
// ============================================================================

const FALLBACK_ENV: Record<string, string> = {
  "VITE_SUPABASE_URL": "https://dmpmbdveubwjznmyxdml.supabase.co",
  "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcG1iZHZldWJ3anpubXl4ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODg1MTIsImV4cCI6MjA3OTY2NDUxMn0.km57K39yOTo9_5xRdaXfDWSmXJ8ZXBXbWJmXhjnlFCI"
};

export function getEnv(key: string, defaultValue: string = ""): string {
  // 1. Tenta do import.meta.env (Padrão Vite)
  try {
    const meta = (import.meta as any);
    if (meta?.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {}

  // 2. Tenta do process.env (Node/Shim) de forma segura
  try {
    const processEnv = (typeof process !== 'undefined' && process.env) ? process.env : (window as any).process?.env;
    if (processEnv && processEnv[key]) {
      return processEnv[key];
    }
  } catch (e) {}

  // 3. Tenta do Fallback Manual
  if (FALLBACK_ENV[key]) return FALLBACK_ENV[key];

  return defaultValue;
}