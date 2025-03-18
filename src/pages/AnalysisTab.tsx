import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBets } from "@/context/BetContext";
import { formatCurrency } from "@/lib/bet-utils";
import { Bet } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface GroupedData {
  key: string;
  GREEN: number;
  RED: number;
  REEMBOLSO: number;
  Pendente: number;
  total: number;
  profit: number;
}

const groupOptions = [
  { value: "homeTeam", label: "Time Mandante" },
  { value: "awayTeam", label: "Time Visitante" },
  { value: "market", label: "Mercado" },
  { value: "bookmaker", label: "Casa de Apostas" },
  { value: "competition", label: "Competição" },
];

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const AnalysisTab: React.FC = () => {
  const { bets } = useBets();
  const [groupBy, setGroupBy] = useState<string>("homeTeam");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "key", direction: "asc" });

  // Atualiza a ordenação para a coluna de grupo quando groupBy muda
  useEffect(() => {
    setSortConfig({ key: "key", direction: "asc" });
  }, [groupBy]);

  // Agrupa as apostas com base na coluna selecionada e calcula os totais
  const groupedData: GroupedData[] = useMemo(() => {
    const groups: { [key: string]: GroupedData } = {};
    bets.forEach((bet) => {
      // Obter o valor do grupo com base no campo selecionado
      const key = (bet[groupBy as keyof Bet] as string) || "N/A";
      if (!groups[key]) {
        groups[key] = {
          key,
          GREEN: 0,
          RED: 0,
          REEMBOLSO: 0,
          Pendente: 0,
          total: 0,
          profit: 0,
        };
      }
      groups[key].total += 1;
      if (bet.result === "GREEN") groups[key].GREEN += 1;
      else if (bet.result === "RED") groups[key].RED += 1;
      else if (bet.result === "REEMBOLSO") groups[key].REEMBOLSO += 1;
      else groups[key].Pendente += 1;

      groups[key].profit += bet.profitCurrency || 0;
    });
    return Object.values(groups);
  }, [bets, groupBy]);

  // Função para alternar a ordenação ao clicar no cabeçalho
  const handleSort = (columnKey: string) => {
    if (sortConfig.key === columnKey) {
      setSortConfig({
        key: columnKey,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key: columnKey, direction: "asc" });
    }
  };

  // Aplica a ordenação ao array agrupado
  const sortedData = useMemo(() => {
    const sorted = [...groupedData].sort((a, b) => {
      const key = sortConfig.key;
      if (key === "key") {
        return (
          a.key.localeCompare(b.key) * (sortConfig.direction === "asc" ? 1 : -1)
        );
      } else {
        const aVal = a[key as keyof GroupedData] as number;
        const bVal = b[key as keyof GroupedData] as number;
        return (aVal - bVal) * (sortConfig.direction === "asc" ? 1 : -1);
      }
    });
    return sorted;
  }, [groupedData, sortConfig]);

  const getProfitColorClass = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-neutral-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Apostas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="groupBy" className="block mb-1">
            Agrupar por:
          </Label>
          <Select value={groupBy} onValueChange={(val) => setGroupBy(val)}>
            <SelectTrigger id="groupBy">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("key")}
              >
                {groupOptions.find((o) => o.value === groupBy)?.label}
                {sortConfig.key === "key" && (
                  sortConfig.direction === "asc" ? (
                    <ChevronUp className="inline-block ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline-block ml-1 h-4 w-4" />
                  )
                )}
              </TableHead>
              {["GREEN", "RED", "REEMBOLSO", "Pendente", "total"].map((col) => (
                <TableHead
                  key={col}
                  className="cursor-pointer"
                  onClick={() => handleSort(col)}
                >
                  {col === "total" ? "Total" : col}
                  {sortConfig.key === col && (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="inline-block ml-1 h-4 w-4" />
                    )
                  )}
                </TableHead>
              ))}
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("profit")}
              >
                Lucro/Prejuízo
                {sortConfig.key === "profit" && (
                  sortConfig.direction === "asc" ? (
                    <ChevronUp className="inline-block ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline-block ml-1 h-4 w-4" />
                  )
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((group) => (
              <TableRow key={group.key}>
                <TableCell>{group.key}</TableCell>
                <TableCell>{group.GREEN}</TableCell>
                <TableCell>{group.RED}</TableCell>
                <TableCell>{group.REEMBOLSO}</TableCell>
                <TableCell>{group.Pendente}</TableCell>
                <TableCell>{group.total}</TableCell>
                <TableCell
                  className={`text-right ${getProfitColorClass(group.profit)}`}
                >
                  {formatCurrency(group.profit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AnalysisTab;