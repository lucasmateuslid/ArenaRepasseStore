
export const encodeCarUrl = (id: string, make: string, model: string, year: number): string => {
  // Cria o slug: marca-modelo-ano
  // Remove acentos e caracteres especiais
  const slug = `${make}-${model}-${year}`
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Base64 encoding simples para o ID (Obfuscação visual, não encriptação)
  // Remove o padding '=' para deixar a URL mais limpa
  const encodedId = btoa(id).replace(/=/g, '');

  return `${slug}-${encodedId}`;
};

export const decodeCarIdFromUrl = (param: string): string | null => {
  if (!param) return null;

  // O formato esperado é slug-encodedId.
  // Pegamos a última parte após o último hífen.
  const parts = param.split('-');
  if (parts.length < 2) return null;

  const encodedId = parts[parts.length - 1];

  try {
    // Recoloca padding se necessário (embora atob em browsers modernos costuma tolerar)
    return atob(encodedId);
  } catch (e) {
    console.error("Falha ao decodificar ID do veículo da URL", e);
    return null;
  }
};
