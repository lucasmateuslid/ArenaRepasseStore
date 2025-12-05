
// ============================================================================
// getEnv: Recuperação segura de variáveis de ambiente
// Suporta: Vite (import.meta.env), Node (process.env) e FALLBACK MANUAL
// ============================================================================

// ⬇️⬇️⬇️ ÁREA DE CONFIGURAÇÃO MANUAL ⬇️⬇️⬇️
// COLOQUE SUAS CHAVES DO SUPABASE AQUI SE O .ENV NÃO ESTIVER FUNCIONANDO
const FALLBACK_ENV: Record<string, string> = {
   // Ex: AIzaSy...
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
