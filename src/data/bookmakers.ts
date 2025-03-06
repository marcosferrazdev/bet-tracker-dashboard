
import { Bookmaker } from '@/types';
import { generateId } from '@/lib/bet-utils';

// Lista de casas de apostas licenciadas no Brasil (ou em processo de licenciamento)
export const brazilianBookmakers: Bookmaker[] = [
  { id: generateId(), name: 'Bet365', isLicensed: true },
  { id: generateId(), name: 'Betano', isLicensed: true },
  { id: generateId(), name: 'Sportingbet', isLicensed: true },
  { id: generateId(), name: 'Galera.bet', isLicensed: true },
  { id: generateId(), name: 'Betsson', isLicensed: true },
  { id: generateId(), name: 'KTO', isLicensed: true },
  { id: generateId(), name: 'Parimatch', isLicensed: true },
  { id: generateId(), name: 'Betfair', isLicensed: true },
  { id: generateId(), name: 'Betway', isLicensed: true },
  { id: generateId(), name: 'Estrela Bet', isLicensed: true },
  { id: generateId(), name: 'Bet7k', isLicensed: true },
  { id: generateId(), name: 'BC Game', isLicensed: true },
  { id: generateId(), name: 'PagBet', isLicensed: true },
  { id: generateId(), name: 'BetNacional', isLicensed: true },
  { id: generateId(), name: 'F12.Bet', isLicensed: true },
  { id: generateId(), name: 'Esportes da Sorte', isLicensed: true },
  { id: generateId(), name: 'Betmotion', isLicensed: true },
  { id: generateId(), name: 'Apostou Brasil', isLicensed: true }
];
