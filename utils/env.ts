
export function getEnv(key: string, defaultValue: string = ""): string {
  const FALLBACK_ENV: Record<string, string> = {
    "VITE_SUPABASE_URL": "https://dmpmbdveubwjznmyxdml.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcG1iZHZldWJ3anpubXl4ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODg1MTIsImV4cCI6MjA3OTY2NDUxMn0.km57K39yOTo9_5xRdaXfDWSmXJ8ZXBXbWJmXhjnlFCI"
  };

  try {
    const processEnv = (typeof window !== 'undefined' && (window as any).process?.env) || {};
    if (processEnv[key]) return processEnv[key];
  } catch (e) {}

  return FALLBACK_ENV[key] || defaultValue;
}
