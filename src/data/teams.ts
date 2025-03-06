
import { Team } from '@/types';
import { generateId } from '@/lib/bet-utils';

export const teams: Team[] = [
  // Times brasileiros
  { id: generateId(), name: 'Flamengo', country: 'Brasil' },
  { id: generateId(), name: 'Palmeiras', country: 'Brasil' },
  { id: generateId(), name: 'São Paulo', country: 'Brasil' },
  { id: generateId(), name: 'Corinthians', country: 'Brasil' },
  { id: generateId(), name: 'Santos', country: 'Brasil' },
  { id: generateId(), name: 'Fluminense', country: 'Brasil' },
  { id: generateId(), name: 'Botafogo', country: 'Brasil' },
  { id: generateId(), name: 'Vasco da Gama', country: 'Brasil' },
  { id: generateId(), name: 'Grêmio', country: 'Brasil' },
  { id: generateId(), name: 'Internacional', country: 'Brasil' },
  { id: generateId(), name: 'Cruzeiro', country: 'Brasil' },
  { id: generateId(), name: 'Atlético Mineiro', country: 'Brasil' },
  { id: generateId(), name: 'Athletico Paranaense', country: 'Brasil' },
  { id: generateId(), name: 'Bahia', country: 'Brasil' },
  { id: generateId(), name: 'Fortaleza', country: 'Brasil' },
  { id: generateId(), name: 'Red Bull Bragantino', country: 'Brasil' },
  { id: generateId(), name: 'Cuiabá', country: 'Brasil' },
  { id: generateId(), name: 'Goiás', country: 'Brasil' },
  { id: generateId(), name: 'Coritiba', country: 'Brasil' },
  { id: generateId(), name: 'Juventude', country: 'Brasil' },
  
  // Times internacionais
  { id: generateId(), name: 'Real Madrid', country: 'Espanha' },
  { id: generateId(), name: 'Barcelona', country: 'Espanha' },
  { id: generateId(), name: 'Atlético de Madrid', country: 'Espanha' },
  { id: generateId(), name: 'Manchester City', country: 'Inglaterra' },
  { id: generateId(), name: 'Manchester United', country: 'Inglaterra' },
  { id: generateId(), name: 'Liverpool', country: 'Inglaterra' },
  { id: generateId(), name: 'Chelsea', country: 'Inglaterra' },
  { id: generateId(), name: 'Arsenal', country: 'Inglaterra' },
  { id: generateId(), name: 'Tottenham', country: 'Inglaterra' },
  { id: generateId(), name: 'Juventus', country: 'Itália' },
  { id: generateId(), name: 'Inter de Milão', country: 'Itália' },
  { id: generateId(), name: 'Milan', country: 'Itália' },
  { id: generateId(), name: 'Napoli', country: 'Itália' },
  { id: generateId(), name: 'Bayern de Munique', country: 'Alemanha' },
  { id: generateId(), name: 'Borussia Dortmund', country: 'Alemanha' },
  { id: generateId(), name: 'Paris Saint-Germain', country: 'França' },
  { id: generateId(), name: 'Olympique de Marseille', country: 'França' },
  { id: generateId(), name: 'Benfica', country: 'Portugal' },
  { id: generateId(), name: 'Porto', country: 'Portugal' },
  { id: generateId(), name: 'Sporting', country: 'Portugal' },
  { id: generateId(), name: 'Ajax', country: 'Holanda' },
  { id: generateId(), name: 'River Plate', country: 'Argentina' },
  { id: generateId(), name: 'Boca Juniors', country: 'Argentina' }
];
