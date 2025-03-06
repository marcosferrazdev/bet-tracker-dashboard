
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Bet, BetResult } from '@/types';
import { useBets } from '@/context/BetContext';
import { formatCurrency, formatDate, getResultClass, getResultBgClass } from '@/lib/bet-utils';
import { PlusCircle, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const BetList: React.FC = () => {
  const { bets, deleteBet } = useBets();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const itemsPerPage = 10;
  
  // Filter bets based on search term
  const filteredBets = bets.filter(bet => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bet.tipster.toLowerCase().includes(searchLower) ||
      bet.competition.toLowerCase().includes(searchLower) ||
      bet.homeTeam.toLowerCase().includes(searchLower) ||
      bet.awayTeam.toLowerCase().includes(searchLower) ||
      bet.market.toLowerCase().includes(searchLower) ||
      bet.bookmaker.toLowerCase().includes(searchLower) ||
      bet.entry.toLowerCase().includes(searchLower)
    );
  });
  
  // Sort bets by date (newest first)
  const sortedBets = [...filteredBets].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Calculate pagination
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
  
  const renderResultBadge = (result: BetResult) => {
    let label = "Pendente";
    let variant = "secondary";
    
    switch (result) {
      case "GREEN":
        label = "Green";
        variant = "success";
        break;
      case "RED":
        label = "Red";
        variant = "destructive";
        break;
      case "REEMBOLSO":
        label = "Reembolso";
        variant = "outline";
        break;
    }
    
    return (
      <Badge variant={variant as any} className="uppercase text-xs">
        {label}
      </Badge>
    );
  };

  return (
    <div>
      <PageHeader 
        title="Apostas" 
        subtitle="Gerencie suas apostas"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Apostas' }
        ]}
      />
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Pesquisar apostas..."
            className="pl-10 w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Link to="/nova-aposta">
          <Button className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Aposta
          </Button>
        </Link>
      </div>
      
      {sortedBets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-neutral-100">
          <h3 className="text-lg font-medium text-neutral-800 mb-2">Nenhuma aposta encontrada</h3>
          <p className="text-neutral-600 mb-6">Comece adicionando sua primeira aposta.</p>
          <Link to="/nova-aposta">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
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
                    <TableHead>Data</TableHead>
                    <TableHead>Jogo</TableHead>
                    <TableHead>Mercado</TableHead>
                    <TableHead>Odd</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((bet) => (
                    <TableRow key={bet.id}>
                      <TableCell className="font-medium">
                        {formatDate(bet.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{bet.homeTeam} x {bet.awayTeam}</span>
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
                      <TableCell>
                        {renderResultBadge(bet.result)}
                      </TableCell>
                      <TableCell className={getResultClass(bet.result)}>
                        {formatCurrency(bet.profitCurrency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/editar-aposta/${bet.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteClick(bet.id)}
                          >
                            <Trash2 className="h-4 w-4 text-danger-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              
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
        </>
      )}
      
      {/* Delete confirmation dialog */}
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
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-danger-500 hover:bg-danger-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BetList;
