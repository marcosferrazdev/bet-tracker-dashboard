// BetList.tsx
import PageHeader from "@/components/PageHeader";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBets } from "@/context/BetContext";
import { formatCurrency, formatDate, generateId, getProfitColorClass } from "@/lib/bet-utils";
import { Bet, BetResult } from "@/types";
import { PopoverClose } from "@radix-ui/react-popover";
import { endOfDay, format, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Filter,
  MoreVertical,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

const BetList: React.FC = () => {
  const { bets, deleteBet, updateBet, addBet, unitValue } = useBets();

  // Estados de busca e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para exclusão de aposta
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Estados para a modal de filtros
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

  // Estados para filtro de data
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);

  // Função para normalizar data considerando o fuso horário local
  const normalizeDate = (date: Date | string) => {
    const d = new Date(date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return startOfDay(localDate);
  };

  const filteredBets = bets.filter((bet) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      bet.tipster.toLowerCase().includes(searchLower) ||
      bet.competition.toLowerCase().includes(searchLower) ||
      bet.homeTeam.toLowerCase().includes(searchLower) ||
      bet.awayTeam.toLowerCase().includes(searchLower) ||
      bet.market.toLowerCase().includes(searchLower) ||
      bet.bookmaker.toLowerCase().includes(searchLower) ||
      bet.entry.toLowerCase().includes(searchLower);
    
    const matchesResult =
      selectedResults.length === 0 ||
      ((selectedResults.includes("Pendente") && bet.result === null) ||
        (bet.result !== null && selectedResults.includes(bet.result)));

    // Filtro de data - só aplica se ambas as datas estiverem definidas
    const betDate = normalizeDate(bet.date);
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

  // Ordenação decrescente por data
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

  // Atualiza o resultado da aposta
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

  // Renderiza o Badge do resultado
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

  // Duplicar aposta
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

  // Lógica da modal de filtros
  const toggleFilter = (value: string) => {
    if (tempSelectedResults.includes(value)) {
      setTempSelectedResults(tempSelectedResults.filter((v) => v !== value));
    } else {
      setTempSelectedResults([...tempSelectedResults, value]);
    }
  };

  const applyFilters = () => {
    // Se uma data estiver preenchida, a outra também deve estar
    if ((tempStartDate && !tempEndDate) || (!tempStartDate && tempEndDate)) {
      return; // Não aplica filtro se apenas uma data estiver preenchida
    }
    // Verifica se a data final é anterior à data inicial
    if (tempStartDate && tempEndDate && isAfter(tempStartDate, tempEndDate)) {
      return; // Não aplica filtro se a data final for anterior à inicial
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

  const clearDateFilters = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
  };

  // Função auxiliar para determinar se o botão deve estar desabilitado
  const isApplyDisabled = () => {
    // Desabilita se apenas uma data estiver preenchida
    if ((tempStartDate && !tempEndDate) || (!tempStartDate && tempEndDate)) {
      return true;
    }
    // Desabilita se a data final for anterior à inicial
    if (tempStartDate && tempEndDate && isAfter(tempStartDate, tempEndDate)) {
      return true;
    }
    return false;
  };

  return (
    <div>
      <PageHeader
        title="Apostas"
        subtitle="Gerencie suas apostas"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Apostas" }]}
      />

      {/* Barra superior com pesquisa, ícone de filtro e botão Nova Aposta */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Pesquisar apostas..."
              className="pl-10 w-60 sm:w-72"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden"
            onClick={() => setShowFilterModal(true)}
          >
            <Filter className="h-4 w-4" />
            {(selectedResults.length < 4 || (startDate && endDate)) && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex"
            onClick={() => setShowFilterModal(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {(selectedResults.length < 4 || (startDate && endDate)) && (
              <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/nova-aposta" className="md:hidden">
            <Button size="icon" className="bg-blue-500 hover:bg-blue-600 text-white">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/nova-aposta" className="hidden md:inline-block">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Aposta
            </Button>
          </Link>
        </div>
      </div>

      {sortedBets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-neutral-100">
          <h3 className="text-lg font-medium text-neutral-800 mb-2">
            Nenhuma aposta encontrada
          </h3>
          <p className="text-neutral-600 mb-6">
            Comece adicionando sua primeira aposta ou ajuste os filtros.
          </p>
          <Link to="/nova-aposta">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Aposta
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Ações</TableHead>
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
                        <div className="md:hidden">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-36">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleCopyBet(bet)}
                              >
                                <Copy className="h-4 w-4 mr-2" /> Copiar
                              </Button>
                              <Link to={`/editar-aposta/${bet.id}`}>
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
                                className="w-full justify-start text-danger-500"
                                onClick={() => handleDeleteClick(bet.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </Button>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="hidden md:flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => handleCopyBet(bet)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Link to={`/editar-aposta/${bet.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteClick(bet.id)}>
                            <Trash2 className="h-4 w-4 text-danger-500" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatDate(bet.date)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {bet.homeTeam} x {bet.awayTeam}
                          </span>
                          <span className="text-sm text-neutral-500">{bet.competition}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{bet.entry}</span>
                          <span className="text-xs text-neutral-500">{bet.market}</span>
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
                              <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, "GREEN")}>
                                Green
                              </Button>
                            </PopoverClose>
                            <PopoverClose asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, "RED")}>
                                Red
                              </Button>
                            </PopoverClose>
                            <PopoverClose asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, "REEMBOLSO")}>
                                Reembolso
                              </Button>
                            </PopoverClose>
                            <PopoverClose asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleResolveBet(bet, null)}>
                                Pendente
                              </Button>
                            </PopoverClose>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className={`${getProfitColorClass(bet.result)} text-right`}>
                        {formatCurrency(bet.profitCurrency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mb-8">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)}>
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de Filtro */}
      <AlertDialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filtrar Apostas</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione os critérios para filtrar suas apostas:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-6 my-4">
            {/* Filtros de Resultado */}
            <div>
              <h3 className="text-sm font-medium mb-2">Resultados</h3>
              <div className="flex flex-col gap-3">
                {["GREEN", "RED", "REEMBOLSO", "Pendente"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tempSelectedResults.includes(status)}
                      onChange={() => toggleFilter(status)}
                      id={status}
                      className="form-checkbox h-4 w-4 text-primary-600"
                    />
                    <label htmlFor={status} className="text-sm cursor-pointer">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtros de Data */}
            <div>
              <h3 className="text-sm font-medium mb-2">Período</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="startDate" className="text-sm mb-1 block">Data Inicial</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {tempStartDate
                            ? format(tempStartDate, "dd/MM/yyyy", { locale: ptBR })
                            : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={tempStartDate}
                          onSelect={setTempStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="endDate" className="text-sm mb-1 block">Data Final</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {tempEndDate
                            ? format(tempEndDate, "dd/MM/yyyy", { locale: ptBR })
                            : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={tempEndDate}
                          onSelect={setTempEndDate}
                          initialFocus
                          disabled={(date) => tempStartDate ? isBefore(date, tempStartDate) : false}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {(tempStartDate || tempEndDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilters}
                    className="w-full"
                  >
                    Limpar datas
                  </Button>
                )}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={cancelFilters}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                onClick={applyFilters} 
                disabled={isApplyDisabled()}
              >
                Aplicar
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-danger-500 hover:bg-danger-600 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BetList;