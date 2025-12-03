// ============================================================================
// getEnv: Recuperação segura de variáveis de ambiente
// Suporta: Vite (import.meta.env), Node (process.env) e fallback opcional
// ============================================================================

export function getEnv(key: string, fallback?: string): string {
  const viteValue = (import.meta as any).env?.[key];
  if (viteValue !== undefined) return viteValue;

  const nodeValue = (typeof process !== "undefined" && process.env?.[key]);
  if (nodeValue !== undefined) return nodeValue;

  if (fallback !== undefined) return fallback;

  console.warn(`⚠ Variável de ambiente ausente: ${key}`);
  return "";
}
