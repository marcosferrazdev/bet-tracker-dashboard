
import { Competition } from '@/types';
import { generateId } from '@/lib/bet-utils';

export const competitions: Competition[] = [
  // Brasileiras
  { id: generateId(), name: 'Campeonato Brasileiro Série A', country: 'Brasil' },
  { id: generateId(), name: 'Campeonato Brasileiro Série B', country: 'Brasil' },
  { id: generateId(), name: 'Copa do Brasil', country: 'Brasil' },
  { id: generateId(), name: 'Campeonato Paulista', country: 'Brasil' },
  { id: generateId(), name: 'Campeonato Carioca', country: 'Brasil' },
  { id: generateId(), name: 'Campeonato Mineiro', country: 'Brasil' },
  { id: generateId(), name: 'Campeonato Gaúcho', country: 'Brasil' },
  
  // Internacionais
  { id: generateId(), name: 'Copa Libertadores', country: 'Internacional' },
  { id: generateId(), name: 'Copa Sul-Americana', country: 'Internacional' },
  { id: generateId(), name: 'Premier League', country: 'Inglaterra' },
  { id: generateId(), name: 'La Liga', country: 'Espanha' },
  { id: generateId(), name: 'Serie A', country: 'Itália' },
  { id: generateId(), name: 'Bundesliga', country: 'Alemanha' },
  { id: generateId(), name: 'Ligue 1', country: 'França' },
  { id: generateId(), name: 'Liga Portugal', country: 'Portugal' },
  { id: generateId(), name: 'UEFA Champions League', country: 'Europa' },
  { id: generateId(), name: 'UEFA Europa League', country: 'Europa' },
  { id: generateId(), name: 'UEFA Conference League', country: 'Europa' },
  { id: generateId(), name: 'Copa del Rey', country: 'Espanha' },
  { id: generateId(), name: 'FA Cup', country: 'Inglaterra' },
  { id: generateId(), name: 'Carabao Cup', country: 'Inglaterra' },
  { id: generateId(), name: 'Copa América', country: 'Internacional' },
  { id: generateId(), name: 'Eurocopa', country: 'Europa' },
  { id: generateId(), name: 'Copa do Mundo', country: 'Internacional' }
];
