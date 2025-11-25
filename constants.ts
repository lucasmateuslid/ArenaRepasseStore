import { Car } from './types';

// O banco de dados agora é a única fonte da verdade.
export const MOCK_CARS: Car[] = [];

// Lista de locais para filtros visuais
export const AVAILABLE_LOCATIONS = [
  'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 
  'Curitiba, PR', 'Porto Alegre, RS', 'Salvador, BA', 
  'Brasília, DF', 'Goiânia, GO', 'Recife, PE', 'Fortaleza, CE'
];