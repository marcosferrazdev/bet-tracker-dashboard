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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBets } from "@/context/BetContext";
import { formatCurrency, formatDate, generateId } from "@/lib/bet-utils";
import { Bet, BetResult } from "@/types";
import { PopoverClose } from "@radix-ui/react-popover";
import {
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

export function getProfitColorClass(result: BetResult) {
  switch (result) {
    case "GREEN":
      return "text-green-600 font-medium";
    case "RED":
      return "text-red-600 font-medium";
    case "REEMBOLSO":
      return "text-neutral-500 font-medium";
    default:
      return "text-neutral-600";
  }
}

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

  // Função de filtragem principal
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
    return matchesSearch && matchesResult;
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
    } else if (newResult === null) {
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
    setSelectedResults(tempSelectedResults);
    setShowFilterModal(false);
    setCurrentPage(1);
  };

  const cancelFilters = () => {
    setTempSelectedResults([...selectedResults]);
    setShowFilterModal(false);
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
          <Button variant="outline" size="sm" onClick={() => setShowFilterModal(true)}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Link to="/nova-aposta">
          <Button>
            <PlusCircle className="h-4 w-4" />
            {/* Opcional: para telas maiores, você pode exibir o texto */}
            <span className="hidden md:inline">Nova Aposta</span>
          </Button>
        </Link>
      </div>

      {sortedBets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-neutral-100">
          <h3 className="text-lg font-medium text-neutral-800 mb-2">
            Nenhuma aposta encontrada
          </h3>
          <p className="text-neutral-600 mb-6">
            Comece adicionando sua primeira aposta.
          </p>
          <Link to="/nova-aposta">
            <Button>
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">Adicionar Aposta</span>
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
                    <TableHead className="text-rigth">Ações</TableHead>
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
                        {/* Menu para telas pequenas */}
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
                        {/* Botões para telas maiores */}
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

      {/* Modal de Filtro de Resultados */}
      <AlertDialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filtrar Resultados</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione os resultados que deseja visualizar:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 my-4">
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
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={cancelFilters}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={applyFilters}>
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
