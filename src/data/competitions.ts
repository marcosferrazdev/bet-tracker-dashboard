import { Competition } from "@/types";
import { generateId } from "@/lib/bet-utils";

export const competitions: Competition[] = [
  // ALEMANHA
  { id: generateId(), name: "Bundesliga 1", country: "Alemanha" },
  { id: generateId(), name: "Bundesliga 2", country: "Alemanha" },
  { id: generateId(), name: "DFB Pokal", country: "Alemanha" },
  { id: generateId(), name: "Supercopa da Alemanha", country: "Alemanha" },

  // ARGENTINA
  { id: generateId(), name: "Campeonato Argentino", country: "Argentina" },

  // BRASIL
  { id: generateId(), name: "Brasileiro - Série A", country: "Brasil" },
  { id: generateId(), name: "Brasileiro - Série B", country: "Brasil" },
  { id: generateId(), name: "Brasileiro - Série C", country: "Brasil" },
  { id: generateId(), name: "Brasileiro - Série D", country: "Brasil" },
  { id: generateId(), name: "Brasileiro - Sub 20", country: "Brasil" },
  {
    id: generateId(),
    name: "Brasileiro - Série A1 (Feminino)",
    country: "Brasil",
  },
  { id: generateId(), name: "Copa do Brasil", country: "Brasil" },
  { id: generateId(), name: "Estaduais", country: "Brasil" },
  { id: generateId(), name: "Catarinense Sub-20", country: "Brasil" },
  { id: generateId(), name: "Taça Rio", country: "Brasil" },
  { id: generateId(), name: "Copa Paulista", country: "Brasil" },
  { id: generateId(), name: "Copa Santa Catarina", country: "Brasil" },

  // ESPANHA
  { id: generateId(), name: "La Liga", country: "Espanha" },
  { id: generateId(), name: "La Liga 2", country: "Espanha" },
  { id: generateId(), name: "Copa do Rei", country: "Espanha" },
  { id: generateId(), name: "Supercopa da Espanha", country: "Espanha" },

  // EUA
  { id: generateId(), name: "MLS", country: "EUA" },
  { id: generateId(), name: "NBA", country: "EUA" },

  // FRANÇA
  { id: generateId(), name: "Ligue 1", country: "França" },
  { id: generateId(), name: "Ligue 2", country: "França" },
  { id: generateId(), name: "Copa da França", country: "França" },
  { id: generateId(), name: "Supercopa da França", country: "França" },

  // HOLANDA
  { id: generateId(), name: "Eredivisie", country: "Holanda" },
  { id: generateId(), name: "Copa da Holanda", country: "Holanda" },

  // INGLATERRA
  { id: generateId(), name: "Premier League", country: "Inglaterra" },
  { id: generateId(), name: "Championship", country: "Inglaterra" },
  { id: generateId(), name: "FA Cup", country: "Inglaterra" },
  { id: generateId(), name: "Copa da Liga", country: "Inglaterra" },
  { id: generateId(), name: "Community Shield", country: "Inglaterra" },

  // ITÁLIA
  { id: generateId(), name: "Serie A", country: "Itália" },
  { id: generateId(), name: "Copa da Itália", country: "Itália" },
  { id: generateId(), name: "Supercopa da Itália", country: "Itália" },

  // PORTUGAL
  { id: generateId(), name: "Primeira Liga", country: "Portugal" },
  { id: generateId(), name: "Copa de Portugal", country: "Portugal" },
  { id: generateId(), name: "Supercopa de Portugal", country: "Portugal" },

  // NORUEGA
  { id: generateId(), name: "Eliteserien", country: "Noruega" },

  // SUÉCIA
  { id: generateId(), name: "Allsvenskan", country: "Suécia" },
  { id: generateId(), name: "Divisão 1", country: "Suécia" },
  { id: generateId(), name: "Superettan", country: "Suécia" },

  // TURQUIA
  { id: generateId(), name: "Super Lig", country: "Turquia" },
  { id: generateId(), name: "Supercopa da Turquia", country: "Turquia" },

  // SULAMERICANA
  { id: generateId(), name: "Copa Sul-Americana", country: "Sulamericana" },
  { id: generateId(), name: "Copa Libertadores", country: "Sulamericana" },
  { id: generateId(), name: "Recopa", country: "Sulamericana" },
  {
    id: generateId(),
    name: "Eliminatórias América do Sul",
    country: "Sulamericana",
  },
  { id: generateId(), name: "Copa América", country: "Sulamericana" },

  // EUROPA
  { id: generateId(), name: "Champions League", country: "Europa" },
  { id: generateId(), name: "Conference League", country: "Europa" },
  { id: generateId(), name: "Europa League", country: "Europa" },
  { id: generateId(), name: "Nations", country: "Europa" },
  { id: generateId(), name: "Eliminatórias Europa", country: "Europa" },
  { id: generateId(), name: "Eurocopa", country: "Europa" },
  { id: generateId(), name: "Supercopa da Europa", country: "Europa" },

  // MUNDO
  { id: generateId(), name: "Mundial Interclubes", country: "Mundo" },
  { id: generateId(), name: "Copa do Mundo", country: "Mundo" },
  { id: generateId(), name: "Copa das Confederações", country: "Mundo" },
  { id: generateId(), name: "Amistosos", country: "Mundo" },
  { id: generateId(), name: "AFC Champions League", country: "Mundo" },
  { id: generateId(), name: "Olimpíadas", country: "Mundo" },
  { id: generateId(), name: "Copa das Ligas", country: "Mundo" },

  // MÉDIO ORIENTE
  { id: generateId(), name: "Arábia Saudita", country: "Médio Oriente" },
  { id: generateId(), name: "Bahrein", country: "Médio Oriente" },
  { id: generateId(), name: "Emirados Árabes", country: "Médio Oriente" },
  { id: generateId(), name: "Irã", country: "Médio Oriente" },
  { id: generateId(), name: "Iraque", country: "Médio Oriente" },
  { id: generateId(), name: "Kuwait", country: "Médio Oriente" },
  { id: generateId(), name: "Catar", country: "Médio Oriente" },
  { id: generateId(), name: "Eliminatórias Ásia", country: "Médio Oriente" },

  // EXTREMO ORIENTE
  { id: generateId(), name: "China", country: "Extremo Oriente" },
  { id: generateId(), name: "K League", country: "Extremo Oriente" },
  { id: generateId(), name: "J League", country: "Extremo Oriente" },

  // SUDESTE ASIÁTICO
  { id: generateId(), name: "Indonésia", country: "Sudeste Asiático" },
  { id: generateId(), name: "Tailândia", country: "Sudeste Asiático" },
  { id: generateId(), name: "Irã", country: "Sudeste Asiático" },

  // OCEANIA
  { id: generateId(), name: "Australiano", country: "Oceania" },

  // SUDESTE ASIÁTICO (segunda instância)
  { id: generateId(), name: "Indonésia", country: "Sudeste Asiático" },
  { id: generateId(), name: "Tailândia", country: "Sudeste Asiático" },
  { id: generateId(), name: "Tajiquistão", country: "Sudeste Asiático" },

  // ESCÓCIA
  { id: generateId(), name: "Premiership", country: "Escócia" },

  // AUSTRIA
  { id: generateId(), name: "Austríaco", country: "Austria" },

  // SUIÇA
  { id: generateId(), name: "Suíço", country: "Suíça" },

  // NORUEGA (segunda instância)
  { id: generateId(), name: "Eliteserien", country: "Noruega" },
  { id: generateId(), name: "Obos-ligaen", country: "Noruega" },

  // DINAMARCA
  { id: generateId(), name: "Dinamarquês", country: "Dinamarca" },

  // FINLÂNDIA
  { id: generateId(), name: "Finlandês", country: "Finlândia" },

  // GRÉCIA
  { id: generateId(), name: "Super League Grécia", country: "Grécia" },

  // BÉLGICA
  { id: generateId(), name: "Jupiler", country: "Bélgica" },

  // COLÔMBIA
  { id: generateId(), name: "Colombiano Feminino", country: "Colômbia" },
  { id: generateId(), name: "Colombiano B", country: "Colômbia" },

  // LETÔNIA
  { id: generateId(), name: "Letônia", country: "Letônia" },

  // ISLÂNDIA
  { id: generateId(), name: "Islandês", country: "Islândia" },

  // IRLANDA
  { id: generateId(), name: "Ireland Premier League", country: "Irlanda" },

  // MEXICO
  { id: generateId(), name: "Liga MX", country: "México" },

  // CHILE
  { id: generateId(), name: "Primeira Divisão Chileno", country: "Chile" },

  // AFRICA
  { id: generateId(), name: "Copa da África", country: "África" },

  // BOLIVIA
  { id: generateId(), name: "Campeonato Boliviano", country: "Bolívia" },

  // SERVIA
  { id: generateId(), name: "Super Lig Servia", country: "Servia" },

  // CS
  { id: generateId(), name: "CS", country: "CS" },

  // LOL
  { id: generateId(), name: "LOL", country: "LOL" },

  // FUTSAL
  { id: generateId(), name: "Futsal", country: "Futsal" },

  // FUTEBOL AMERICANO
  { id: generateId(), name: "NFL", country: "Futebol Americano" },

  // TENIS
  { id: generateId(), name: "Tênis", country: "Tênis" },

  // BINGO
  { id: generateId(), name: "Bingo", country: "Bingo" },

  // BOXE
  { id: generateId(), name: "Boxe", country: "Boxe" },

  // URUGUAI
  { id: generateId(), name: "Primeira Divisão Uruguaio", country: "Uruguai" },

  // ENTRETERIMENTO
  { id: generateId(), name: "Eleições", country: "Entreterimento" },
];
