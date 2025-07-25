import FilterModal from "@/components/FilterModal";
import PageHeader from "@/components/PageHeader";
import ShareBetImage from "@/components/ShareBetImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TableBody,
  TableCell,
  Table as TableComponent,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBets } from "@/context/BetContext";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  formatCurrency,
  formatDate,
  generateId,
  getProfitColorClass,
} from "@/lib/bet-utils";
import { Bet, BetResult } from "@/types";
import { PopoverClose } from "@radix-ui/react-popover";
import { endOfDay, isAfter, isBefore, isSameDay, parseISO, startOfDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Filter,
  LayoutGrid,
  MoreVertical,
  PlusCircle,
  Search,
  Share2,
  Table,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/components/ui/theme-provider";
import {
  CalendarIcon,
  ClockIcon,
  CupIcon,
  HomeBetIcon,
  MarketIcon,
  PercentIcon,
  CoinsIcon,
  MoneyBillTrendUpIcon,
} from "@/components/ui/icons";

const normalizeText = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// Funções para formatar data e hora separadamente
const formatDateOnly = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

const formatTimeOnly = (dateString: string): string => {
  const date = parseISO(dateString);
  const hasTime = dateString.includes("T") && !dateString.endsWith("T00:00:00");
  
  if (hasTime) {
    return format(date, "HH:mm", { locale: ptBR });
  }
  return "--:--";
};

const BetList: React.FC = () => {
  const { bets, deleteBet, updateBet, addBet, unitValue } = useBets();
  const { canCreateBet, upgradeRequired, planLimits, isPremium } = useSubscription();
  const { theme } = useTheme();
  const location = useLocation();
  
  // Detecta se está no tema dark (incluindo quando theme é "system")
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const initialViewMode = location.state?.viewMode || "card";
  const [viewMode, setViewMode] = useState<"table" | "card">(initialViewMode);

  // Recupera e salva estado no sessionStorage
  const getStoredState = <T,>(key: string, defaultValue: T): T => {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  };
  const saveState = <T,>(key: string, value: T) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  };

  // Estados de busca, paginação e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareBet, setShareBet] = useState<Bet | null>(null); // Estado para controlar o compartilhamento

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([
    "GREEN",
    "RED",
    "REEMBOLSO",
    "Pendente",
  ]);
  const [tempSelectedResults, setTempSelectedResults] = useState<string[]>([
    ...selectedResults,
  ]);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(
    undefined
  );
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);

  const [lastDuplicatedBetId, setLastDuplicatedBetId] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { viewMode?: "table" | "card" } | undefined;
    if (state?.viewMode) {
      setViewMode(state.viewMode);
      saveState("betListViewMode", state.viewMode);
    }
  }, [location.state]);

  useEffect(() => {
    saveState("betListViewMode", viewMode);
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === "table" ? "card" : "table"));
  };

  // Normaliza a data para o fuso local e início do dia
  const normalizeDate = (date: Date | string) => {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    return startOfDay(parsedDate);
  };

  // Filtragem das apostas
  const filteredBets = bets.filter((bet) => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    const matchesSearch =
      normalizeText(bet.tipster).includes(normalizedSearchTerm) ||
      normalizeText(bet.competition).includes(normalizedSearchTerm) ||
      normalizeText(bet.homeTeam).includes(normalizedSearchTerm) ||
      normalizeText(bet.awayTeam).includes(normalizedSearchTerm) ||
      normalizeText(bet.market).includes(normalizedSearchTerm) ||
      normalizeText(bet.bookmaker).includes(normalizedSearchTerm) ||
      normalizeText(bet.entry).includes(normalizedSearchTerm) ||
      (bet.comboGames &&
        bet.comboGames.some(
          (game) =>
            normalizeText(game.homeTeam).includes(normalizedSearchTerm) ||
            normalizeText(game.awayTeam).includes(normalizedSearchTerm)
        ));

    const matchesResult =
      selectedResults.length === 0 ||
      (selectedResults.includes("Pendente") && bet.result === null) ||
      (bet.result !== null && selectedResults.includes(bet.result));

    const betDate = normalizeDate(bet.date); // Normaliza a data da aposta
    const adjustedStartDate = startDate ? normalizeDate(startDate) : undefined;
    const adjustedEndDate = endDate ? endOfDay(normalizeDate(endDate)) : undefined;

    let matchesDate = true;
    if (adjustedStartDate && adjustedEndDate) {
      matchesDate =
        (isSameDay(betDate, adjustedStartDate) || isAfter(betDate, adjustedStartDate)) &&
        (isSameDay(betDate, adjustedEndDate) || isBefore(betDate, adjustedEndDate));
    }

    return matchesSearch && matchesResult && matchesDate;
  });

  const sortedBets = [...filteredBets].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Paginação
  const totalPages = Math.ceil(sortedBets.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedBets.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Exclusão de aposta
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteBet(deleteId);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteId(null);
  };

  // Resolução de aposta
  const handleResolveBet = (bet: Bet, newResult: BetResult | null) => {
    let updatedProfit = 0;
    let updatedUnits = 0;
    if (newResult === "GREEN") {
      updatedProfit = Number((bet.stake * bet.odds - bet.stake).toFixed(2));
      updatedUnits = Number((updatedProfit / unitValue).toFixed(2));
    } else if (newResult === "RED") {
      updatedProfit = -bet.stake;
      updatedUnits = Number((-bet.stake / unitValue).toFixed(2));
    } else if (newResult === "REEMBOLSO") {
      updatedProfit = 0;
      updatedUnits = 0;
    }
    const updatedBet: Bet = {
      ...bet,
      result: newResult,
      profitCurrency: updatedProfit,
      profitUnits: updatedUnits,
    };
    updateBet(updatedBet);
  };

  // Renderiza o badge do resultado
  const renderResultBadge = (result: BetResult) => {
    if (result === "GREEN") {
      return (
        <Badge className="bg-green-50 border-green-200 text-green-700 uppercase text-xs">
          Green
        </Badge>
      );
    }
    if (result === "RED") {
      return (
        <Badge className="bg-red-50 border-red-200 text-red-700 uppercase text-xs">
          Red
        </Badge>
      );
    }
    if (result === "REEMBOLSO") {
      return (
        <Badge className="bg-neutral-50 border-neutral-200 text-neutral-700 uppercase text-xs">
          Reembolso
        </Badge>
      );
    }
    return (
      <Badge className="bg-secondary-50 border-secondary-200 text-secondary-700 uppercase text-xs">
        Pendente
      </Badge>
    );
  };

  // Copia a aposta
  const handleCopyBet = (bet: Bet) => {
    const newBet: Bet = {
      ...bet,
      id: generateId(),
      result: null,
      profitCurrency: 0,
      profitUnits: 0,
    };
    addBet(newBet);
    setLastDuplicatedBetId(newBet.id);
    
    // Volta para a primeira página para mostrar a aposta duplicada
    setCurrentPage(1);
    
    // Remove o ID após 2 segundos
    setTimeout(() => {
      setLastDuplicatedBetId(null);
    }, 2000);

    // Foca na aposta duplicada após um pequeno delay para garantir que ela foi renderizada
    setTimeout(() => {
      const element = document.getElementById(`bet-${newBet.id}`);
      if (element) {
        // Encontra o container de scroll mais próximo
        const scrollContainer = viewMode === "card" 
          ? element.closest('.md\\:max-h-\\[calc\\(100vh-250px\\)\\]')
          : element.closest('.overflow-x-scroll');

        if (scrollContainer) {
          // Calcula a posição relativa do elemento dentro do container
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top;
          
          // Rola o container para mostrar o elemento
          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + relativeTop - 20,
            behavior: "smooth"
          });
        } else {
          // Se não encontrar o container, usa scrollIntoView
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        // Se não encontrar o elemento, tenta novamente após um delay maior
        setTimeout(() => {
          const retryElement = document.getElementById(`bet-${newBet.id}`);
          if (retryElement) {
            const scrollContainer = viewMode === "card" 
              ? retryElement.closest('.md\\:max-h-\\[calc\\(100vh-250px\\)\\]')
              : retryElement.closest('.overflow-x-scroll');

            if (scrollContainer) {
              const containerRect = scrollContainer.getBoundingClientRect();
              const elementRect = retryElement.getBoundingClientRect();
              const relativeTop = elementRect.top - containerRect.top;
              
              scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + relativeTop - 20,
                behavior: "smooth"
              });
            } else {
              retryElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }, 500);
      }
    }, 100);
  };

  // Função para abrir o modal de compartilhamento
  const handleShareBet = (bet: Bet) => {
    setShareBet(bet);
  };

  // Filtros
  const toggleFilter = (value: string) => {
    if (tempSelectedResults.includes(value)) {
      setTempSelectedResults(tempSelectedResults.filter((v) => v !== value));
    } else {
      setTempSelectedResults([...tempSelectedResults, value]);
    }
  };

  const applyFilters = () => {
    if ((tempStartDate && !tempEndDate) || (!tempStartDate && tempEndDate)) {
      return;
    }
    if (tempStartDate && tempEndDate && isAfter(tempStartDate, tempEndDate)) {
      return;
    }
    setSelectedResults(tempSelectedResults);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowFilterModal(false);
    setCurrentPage(1);
  };

  const cancelFilters = () => {
    setTempSelectedResults([...selectedResults]);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowFilterModal(false);
  };

  const isApplyDisabled = () => {
    if ((tempStartDate && !tempEndDate) || (!tempStartDate && tempEndDate)) {
      return true;
    }
    if (tempStartDate && tempEndDate && isAfter(tempStartDate, tempEndDate)) {
      return true;
    }
    return false;
  };

  // Renderiza os detalhes do jogo
  const renderGameDetails = (bet: Bet) => {
    const games = [
      {
        competition: bet.competition,
        homeTeam: bet.homeTeam,
        awayTeam: bet.awayTeam,
      },
      ...(bet.comboGames || []),
    ];

    return (
      <div className="flex flex-col space-y-1">
        {games.map((game, index) => (
          <div key={index} className="flex flex-col">
            <span className="font-medium">
              {game.homeTeam} x {game.awayTeam}
            </span>
            <span className="text-sm text-muted-foreground">
              {"competition" in game
                ? game.competition
                : "Competição não especificada"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Cabeçalho fixo */}
      <div className="sticky top-0 z-10 bg-background">
        <PageHeader
          title="Apostas"
          subtitle={
            !isPremium && planLimits.maxBets !== null
              ? `Gerencie suas apostas (${bets.length}/${planLimits.maxBets} utilizadas)`
              : "Gerencie suas apostas"
          }
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Apostas" },
          ]}
        />
        <div className="flex items-center justify-between px-4 pb-4 border-b gap-4">
          <div className="relative w-full sm:w-60 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar apostas..."
              className="pl-10 pr-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm("")}
              >
                <span className="text-xl leading-none">×</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilterModal(true)}
                className="relative"
              >
                <Filter className="h-4 w-4" />
              </Button>
              {(selectedResults.length < 4 || (startDate && endDate)) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleViewMode}
              className="relative"
            >
              {viewMode === "table" ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <Table className="h-4 w-4" />
              )}
            </Button>
            {canCreateBet(bets.length) ? (
            <Link to="/nova-aposta" state={{ viewMode }}>
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </Link>
            ) : (
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={upgradeRequired}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 px-4 py-4">
        {sortedBets.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              Nenhuma aposta encontrada
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece adicionando sua primeira aposta ou ajuste os filtros.
            </p>
            {canCreateBet(bets.length) ? (
            <Link to="/nova-aposta" state={{ viewMode}}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Aposta
              </Button>
            </Link>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={upgradeRequired}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Aposta
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "table" && (
              <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col">
                <div className="md:max-h-[calc(100vh-250px)] overflow-auto flex-1">
                  <TableComponent>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ações</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Jogo</TableHead>
                        <TableHead>Mercado</TableHead>
                        <TableHead>Odd</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Casa</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="wait">
                        {currentItems.map((bet) => (
                          <motion.tr
                            key={bet.id}
                            id={`bet-${bet.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              backgroundColor: lastDuplicatedBetId === bet.id ? "hsl(var(--accent))" : "hsl(var(--card))",
                              transition: {
                                backgroundColor: { duration: 0.3 }
                              }
                            }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            <TableCell className="text-center">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-40 p-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleCopyBet(bet)}
                                  >
                                    <Copy className="h-4 w-4 mr-2" /> Copiar
                                  </Button>
                                  <Link to={`/editar-aposta/${bet.id}`} state={{ viewMode }}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start"
                                    >
                                      <Edit className="h-4 w-4 mr-2" /> Editar
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleShareBet(bet)}
                                  >
                                    <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-danger"
                                    onClick={() => handleDeleteClick(bet.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                  </Button>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatDate(bet.date)}
                            </TableCell>
                            <TableCell>{renderGameDetails(bet)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{bet.entry}</span>
                                <span className="text-xs text-muted-foreground">
                                  {bet.market}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{bet.odds.toFixed(2)}</TableCell>
                            <TableCell>{formatCurrency(bet.stake)}</TableCell>
                            <TableCell>{bet.bookmaker}</TableCell>
                            <TableCell>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div className="cursor-pointer">
                                    {renderResultBadge(bet.result)}
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="p-2 flex flex-col gap-1">
                                  <PopoverClose asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleResolveBet(bet, "GREEN")}
                                    >
                                      Green
                                    </Button>
                                  </PopoverClose>
                                  <PopoverClose asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleResolveBet(bet, "RED")}
                                    >
                                      Red
                                    </Button>
                                  </PopoverClose>
                                  <PopoverClose asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleResolveBet(bet, "REEMBOLSO")}
                                    >
                                      Reembolso
                                    </Button>
                                  </PopoverClose>
                                  <PopoverClose asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleResolveBet(bet, null)}
                                    >
                                      Pendente
                                    </Button>
                                  </PopoverClose>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`font-medium ${getProfitColorClass(bet.result)}`}>
                                {formatCurrency(bet.profitCurrency)}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </TableComponent>
                </div>
                {totalPages > 1 && (
                  <div className="border-t p-4 flex justify-center items-center bg-card">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium mx-3">
                      {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {viewMode === "card" && (
              <div className="bg-card rounded-xl shadow-sm border border-border mb-6">
                <div className="p-4 space-y-4 md:max-h-[calc(100vh-250px)] overflow-auto">
                  <AnimatePresence mode="wait">
                    {currentItems.map((bet) => {
                      const isGreen = bet.result === "GREEN";
                      const isRed = bet.result === "RED";
                      const isRefund = bet.result === "REEMBOLSO";
                      // Corrigir erro de linter: considerar pendente apenas se bet.result === null
                      const isPending = bet.result === null;
                      const lucroColor = isGreen
                        ? "bg-[#779964] text-white"
                        : isRed
                        ? "bg-[#991E1E] text-white"
                        : isRefund
                        ? "bg-[#C8C8C8] text-[#171717]"
                        : "bg-[#C9DBDD] text-[#171717]";
                      const statusColor = isGreen
                        ? "bg-[#1E9939]"
                        : isRed
                        ? "bg-[#991E1E]"
                        : isRefund
                        ? "bg-[#CCC7C7]"
                        : "bg-[#C9DBDD]";
                      return (
                        <motion.div
                          key={bet.id}
                          id={`bet-${bet.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            backgroundColor:
                              lastDuplicatedBetId === bet.id
                                ? "hsl(var(--accent))"
                                : isDark ? "#242323" : "#F3F3F3",
                            transition: {
                              backgroundColor: { duration: 0.3 },
                            },
                          }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`relative flex flex-col rounded-2xl shadow-sm border p-4 min-h-[120px] overflow-hidden ${
                            isDark 
                              ? "bg-[#242323] border-border" 
                              : "bg-[#F3F3F3] border-[#D9D9D9]"
                          }`}
                        >
                          {/* Barra lateral de status com popover para trocar resultado */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className={`absolute right-0 top-0 h-full w-8 rounded-r-2xl flex items-center justify-center cursor-pointer ${statusColor}`} style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                <span className="text-white font-bold tracking-widest text-xs select-none">
                                  {isGreen ? 'GREEN' : isRed ? 'RED' : isRefund ? 'REEMBOLSO' : 'PENDENTE'}
                                </span>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="p-2 flex flex-col gap-1 w-32">
                              <PopoverClose asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, "GREEN")}>Green</Button>
                              </PopoverClose>
                              <PopoverClose asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, "RED")}>Red</Button>
                              </PopoverClose>
                              <PopoverClose asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, "REEMBOLSO")}>Reembolso</Button>
                              </PopoverClose>
                              <PopoverClose asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, null)}>Pendente</Button>
                              </PopoverClose>
                            </PopoverContent>
                          </Popover>

                          {/* TOPO: Tags */}
                          <div className="flex flex-wrap items-center gap-2 mb-2 pr-16">
                            {/* Data + Hora */}
                            <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                              isDark 
                                ? "bg-[#CCC7C7] text-[#171717]" 
                                : "bg-[#CCC7C7] text-[#171717]"
                            }`}>
                              <CalendarIcon className="w-2.5 h-2.5" /> {formatDateOnly(bet.date)}
                              {formatTimeOnly(bet.date) !== "--:--" && (
                                <>
                              <div className="mx-0.5"></div>
                              <ClockIcon className="w-2.5 h-2.5" /> {formatTimeOnly(bet.date)}
                              </>
                              )}
                            </span>
                            {/* Competição */}
                            {bet.competition && bet.competition.trim() !== "" && (
                            <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                              isDark 
                                ? "bg-[#CCC7C7] text-[#171717]" 
                                : "bg-[#CCC7C7] text-[#171717]"
                            }`}>
                              <CupIcon className="w-2.5 h-2.5" /> {bet.competition}
                            </span>
                            )}
                            {/* Casa de aposta */}
                            <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                              isDark 
                                ? "bg-[#CCC7C7] text-[#171717]" 
                                : "bg-[#CCC7C7] text-[#171717]"
                            }`}>
                              <HomeBetIcon className="w-2.5 h-2.5" /> {bet.bookmaker}
                            </span>
                            {/* Mercado */}
                            <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                              isDark 
                                ? "bg-[#CCC7C7] text-[#171717]" 
                                : "bg-[#CCC7C7] text-[#171717]"
                            }`}>
                              <MarketIcon className="w-2.5 h-2.5" /> {bet.market}
                            </span>
                          </div>

                          {/* CENTRO: Partida + Entrada */}
                          <div className="flex flex-col items-start justify-center flex-1 my-2 pr-8">
                            <div className={`flex items-center gap-2 text-sm font-semibold ${
                              isDark ? "text-card-foreground" : "text-[#171717]"
                            }`}>
                              {/* Substitua pelo ícone centralizado depois */}
                              {/* <SoccerIcon className="w-5 h-5" /> */}
                              {bet.homeTeam} x {bet.awayTeam}
                            </div>
                            <div className={`text-base font-extrabold mt-1 ${
                              isDark ? "text-card-foreground" : "text-[#171717]"
                            }`}>
                              {bet.entry}
                            </div>
                          </div>

                          {/* BASE: Tags de Odd, Valor, Lucro */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 pr-16">
                            <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                              isDark 
                                ? "bg-[#CCC7C7] text-[#171717]" 
                                : "bg-[#CCC7C7] text-[#171717]"
                            }`}>
                              <PercentIcon className="w-2.5 h-2.5" /> Odd: {bet.odds.toFixed(2)}
                            </span>
                            <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                              isDark 
                                ? "bg-[#CCC7C7] text-[#171717]" 
                                : "bg-[#CCC7C7] text-[#171717]"
                            }`}>
                              <CoinsIcon className="w-2.5 h-2.5" /> Valor: {formatCurrency(bet.stake)}
                            </span>
                            <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${lucroColor}`}>
                              <MoneyBillTrendUpIcon className="w-2.5 h-2.5" /> Lucro: {formatCurrency(bet.profitCurrency)}
                            </span>
                          </div>

                          {/* Menu de ações */}
                          <div className="absolute top-4 right-12 flex flex-col items-end gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-40 p-2">
                                <Button variant="ghost" size="sm" className="w-full justify-start text-sm py-2" onClick={() => handleCopyBet(bet)}>
                                  <Copy className="h-4 w-4 mr-2" /> Copiar
                                </Button>
                                <Link to={`/editar-aposta/${bet.id}`} state={{ viewMode }}>
                                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm py-2">
                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                  </Button>
                                </Link>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-sm py-2" onClick={() => handleShareBet(bet)}>
                                  <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-danger text-sm py-2" onClick={() => handleDeleteClick(bet.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                {totalPages > 1 && (
                  <div className="md:sticky md:bottom-0 md:left-0 md:right-0 md:z-10 border-t p-4 flex justify-center items-center bg-transparent md:bg-background">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium mx-3">
                      {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Filtro */}
      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        selectedResults={selectedResults}
        tempSelectedResults={tempSelectedResults}
        setTempSelectedResults={setTempSelectedResults}
        startDate={startDate}
        endDate={endDate}
        tempStartDate={tempStartDate}
        tempEndDate={tempEndDate}
        setTempStartDate={setTempStartDate}
        setTempEndDate={setTempEndDate}
        onApply={applyFilters}
        onCancel={cancelFilters}
        isApplyDisabled={isApplyDisabled}
      />

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aposta? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-danger hover:bg-danger/90 text-danger-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Compartilhamento */}
      {shareBet && (
        <ShareBetImage bet={shareBet} onClose={() => setShareBet(null)} />
      )}
    </div>
  );
};

export default BetList;