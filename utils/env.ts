
// ============================================================================
// getEnv: Recuperação segura de variáveis de ambiente
// Suporta: Vite (import.meta.env), Node (process.env) e FALLBACK MANUAL
// ============================================================================

// ⬇️⬇️⬇️ ÁREA DE CONFIGURAÇÃO MANUAL ⬇️⬇️⬇️
// COLOQUE SUAS CHAVES DO SUPABASE AQUI SE O .ENV NÃO ESTIVER FUNCIONANDO
const FALLBACK_ENV: Record<string, string> = {
  "VITE_SUPABASE_URL": "https://dmpmbdveubwjznmyxdml.supabase.co",       // Ex: https://seu-projeto.supabase.co
  "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcG1iZHZldWJ3anpubXl4ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODg1MTIsImV4cCI6MjA3OTY2NDUxMn0.km57K39yOTo9_5xRdaXfDWSmXJ8ZXBXbWJmXhjnlFCI",  // Ex: eyJhbGciOiJIUzI1NiIsInR5c...
  "VITE_GOOGLE_API_KEY": "AIzaSyDhfQHXM3RONUjtfvAq-LXIgXyfFlXTY4c"      // Ex: AIzaSy...
};
// ⬆️⬆️⬆️ FIM DA ÁREA DE CONFIGURAÇÃO ⬆️⬆️⬆️

export function getEnv(key: string, defaultValue: string = ""): string {
  // 1. Tenta pegar do Fallback Manual (Prioridade para corrigir problemas de .env)
  if (FALLBACK_ENV[key]) return FALLBACK_ENV[key];

  // 2. Tenta pegar do Vite (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignora erro se import.meta não existir
  }

  // 3. Tenta pegar do Node/Process (process.env)
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignora erro se process não existir
  }

  // 4. Tentativa Inteligente: Se a chave começa com VITE_, tenta buscar sem o prefixo
  if (key.startsWith('VITE_')) {
    const rawKey = key.replace('VITE_', '');
    
    if (FALLBACK_ENV[rawKey]) return FALLBACK_ENV[rawKey];
    
    try {
      if (typeof process !== "undefined" && process.env && process.env[rawKey]) {
        return process.env[rawKey];
      }
    } catch (e) {}
  }

  return defaultValue;
}
