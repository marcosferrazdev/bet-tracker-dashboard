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
import {
  formatCurrency,
  formatDate,
  generateId,
  getProfitColorClass,
} from "@/lib/bet-utils";
import { Bet, BetResult } from "@/types";
import { PopoverClose } from "@radix-ui/react-popover";
import { endOfDay, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";
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

const BetList: React.FC = () => {
  const { bets, deleteBet, updateBet, addBet, unitValue } = useBets();
  const location = useLocation();

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

  // Modo de visualização (tabela ou card)
  const [viewMode, setViewMode] = useState<"table" | "card">(() =>
    getStoredState(
      "betListViewMode",
      window.innerWidth < 768 ? "card" : "table"
    )
  );

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

  // Normaliza a data para o fuso local
  const normalizeDate = (date: Date | string) => {
    const d = new Date(date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return startOfDay(localDate);
  };

  // Filtragem das apostas
  const filteredBets = bets.filter((bet) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      bet.tipster.toLowerCase().includes(searchLower) ||
      bet.competition.toLowerCase().includes(searchLower) ||
      bet.homeTeam.toLowerCase().includes(searchLower) ||
      bet.awayTeam.toLowerCase().includes(searchLower) ||
      bet.market.toLowerCase().includes(searchLower) ||
      bet.bookmaker.toLowerCase().includes(searchLower) ||
      bet.entry.toLowerCase().includes(searchLower) ||
      (bet.comboGames &&
        bet.comboGames.some(
          (game) =>
            game.homeTeam.toLowerCase().includes(searchLower) ||
            game.awayTeam.toLowerCase().includes(searchLower)
        ));

    const matchesResult =
      selectedResults.length === 0 ||
      (selectedResults.includes("Pendente") && bet.result === null) ||
      (bet.result !== null && selectedResults.includes(bet.result));

    const betDate = normalizeDate(bet.date);
    const adjustedStartDate = startDate ? normalizeDate(startDate) : undefined;
    const adjustedEndDate = endDate
      ? endOfDay(normalizeDate(endDate))
      : undefined;

    let matchesDate = true;
    if (adjustedStartDate && adjustedEndDate) {
      matchesDate =
        (isSameDay(betDate, adjustedStartDate) ||
          isAfter(betDate, adjustedStartDate)) &&
        (isSameDay(betDate, adjustedEndDate) ||
          isBefore(betDate, adjustedEndDate));
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
            <span className="text-sm text-neutral-500">
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
    <div className="flex flex-col min-h-screen bg-neutral-50">
      {/* Cabeçalho fixo */}
      <div className="sticky top-0 z-10 bg-neutral-50">
        <PageHeader
          title="Apostas"
          subtitle="Gerencie suas apostas"
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Apostas" },
          ]}
        />
        <div className="flex items-center justify-between px-4 pb-4 border-b gap-4">
          <div className="relative w-full sm:w-60 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
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
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
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
            <Link to="/nova-aposta" state={{ viewMode }}>
              <Button
                size="icon"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 px-4 py-4">
        {sortedBets.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-neutral-100">
            <h3 className="text-lg font-medium text-neutral-800 mb-2">
              Nenhuma aposta encontrada
            </h3>
            <p className="text-neutral-600 mb-6">
              Comece adicionando sua primeira aposta ou ajuste os filtros.
            </p>
            <Link to="/nova-aposta" state={{ viewMode }}>
              <Button className="bg-blue-500 hover:bg-blue-600">
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Aposta
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {viewMode === "table" && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-100 mb-6">
                <div className="overflow-x-scroll md:max-h-[calc(100vh-250px)] overflow-auto">
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
                      {currentItems.map((bet) => (
                        <TableRow key={bet.id}>
                          <TableCell className="text-center">
                            {window.innerWidth >= 768 ? (
                              <div className="flex gap-2 justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyBet(bet)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Link to={`/editar-aposta/${bet.id}`} state={{ viewMode }}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShareBet(bet)}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(bet.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-danger-500" />
                                </Button>
                              </div>
                            ) : (
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
                                    className="w-full justify-start text-danger-500"
                                    onClick={() => handleDeleteClick(bet.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                  </Button>
                                </PopoverContent>
                              </Popover>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatDate(bet.date)}
                          </TableCell>
                          <TableCell>{renderGameDetails(bet)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{bet.entry}</span>
                              <span className="text-xs text-neutral-500">
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
                                    onClick={() =>
                                      handleResolveBet(bet, "GREEN")
                                    }
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
                                    onClick={() =>
                                      handleResolveBet(bet, "REEMBOLSO")
                                    }
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
                          <TableCell
                            className={`${getProfitColorClass(
                              bet.result
                            )} text-right`}
                          >
                            {formatCurrency(bet.profitCurrency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableComponent>
                </div>
                {totalPages > 1 && (
                  <div className="md:sticky md:bottom-0 md:left-0 md:right-0 md:z-10 border-t p-4 flex justify-center items-center bg-transparent md:bg-neutral-50">
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
              <div className="bg-white rounded-xl shadow-sm border border-neutral-100 mb-6">
                <div className="p-4 space-y-4 md:max-h-[calc(100vh-250px)] overflow-auto">
                  {currentItems.map((bet) => (
                    <div
                      key={bet.id}
                      className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {formatDate(bet.date)}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {bet.bookmaker}
                          </div>
                        </div>
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
                              className="w-full justify-start text-sm py-2"
                              onClick={() => handleCopyBet(bet)}
                            >
                              <Copy className="h-4 w-4 mr-2" /> Copiar
                            </Button>
                            <Link to={`/editar-aposta/${bet.id}`} state={{ viewMode }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm py-2"
                              >
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-sm py-2"
                              onClick={() => handleShareBet(bet)}
                            >
                              <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-danger-500 text-sm py-2"
                              onClick={() => handleDeleteClick(bet.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="mt-2">{renderGameDetails(bet)}</div>
                      <div className="mt-2">
                        <span className="font-medium">{bet.entry}</span>
                        <span className="text-xs text-neutral-500 ml-2">
                          {bet.market}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div>
                          <span>Odd: </span>
                          <span className="font-medium">
                            {bet.odds.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span>Valor: </span>
                          <span className="font-medium">
                            {formatCurrency(bet.stake)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
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
                                onClick={() =>
                                  handleResolveBet(bet, "REEMBOLSO")
                                }
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
                        <div
                          className={`${getProfitColorClass(
                            bet.result
                          )} font-medium`}
                        >
                          {formatCurrency(bet.profitCurrency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="md:sticky md:bottom-0 md:left-0 md:right-0 md:z-10 border-t p-4 flex justify-center items-center bg-transparent md:bg-neutral-50">
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
              className="bg-danger-500 hover:bg-danger-600 text-white"
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