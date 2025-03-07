import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBets } from "@/context/BetContext";
import { Bet, BetType, BetResult } from "@/types";
import { generateId, calculateUnits, calculateProfit } from "@/lib/bet-utils";
import { toast } from "sonner";
import SearchableSelect from "./SearchableSelect";

const BetForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    bets,
    addBet,
    updateBet,
    unitValue,
    tipsters,
    markets,
    bookmakers,
    competitions,
    teams,
  } = useBets();
  const isEditing = !!id;

  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [tipster, setTipster] = useState("");
  const [competition, setCompetition] = useState("");
  const [type, setType] = useState<BetType>("Pré");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [market, setMarket] = useState("");
  const [bookmaker, setBookmaker] = useState("");
  const [entry, setEntry] = useState("");
  const [odds, setOdds] = useState<number>(0);
  const [stake, setStake] = useState<number>(0);
  const [commission, setCommission] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<BetResult>(null);

  // Computed values
  const stakeUnits = calculateUnits(stake, unitValue);
  const profitCurrency = calculateProfit(stake, odds, result);
  const profitUnits = calculateUnits(profitCurrency, unitValue);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEditing && tipsters.length === 1 && !tipster) {
      setTipster(tipsters[0].name);
    }
  }, [tipsters, isEditing, tipster]);

  // Carrega dados se estiver editando
  useEffect(() => {
    if (isEditing && id) {
      const betToEdit = bets.find((bet) => bet.id === id);
      if (betToEdit) {
        setDate(new Date(betToEdit.date));
        setTipster(betToEdit.tipster);
        setCompetition(betToEdit.competition);
        setType(betToEdit.type);
        setHomeTeam(betToEdit.homeTeam);
        setAwayTeam(betToEdit.awayTeam);
        setMarket(betToEdit.market);
        setBookmaker(betToEdit.bookmaker);
        setEntry(betToEdit.entry);
        setOdds(betToEdit.odds);
        setStake(betToEdit.stake);
        setCommission(betToEdit.commission);
        setResult(betToEdit.result);
      } else {
        toast.error("Aposta não encontrada");
        navigate("/apostas");
      }
    }
  }, [isEditing, id, bets, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!tipster) newErrors.tipster = "Tipster é obrigatório";
    if (!competition) newErrors.competition = "Competição é obrigatória";
    if (!homeTeam) newErrors.homeTeam = "Time mandante é obrigatório";
    if (!awayTeam) newErrors.awayTeam = "Time visitante é obrigatório";
    if (!market) newErrors.market = "Mercado é obrigatório";
    if (!bookmaker) newErrors.bookmaker = "Casa de apostas é obrigatória";
    if (!entry) newErrors.entry = "Entrada é obrigatória";
    if (!odds) newErrors.odds = "Odd é obrigatória";
    if (odds < 1) newErrors.odds = "Odd deve ser maior que 1";
    if (!stake) newErrors.stake = "Valor da aposta é obrigatório";
    if (stake <= 0) newErrors.stake = "Valor da aposta deve ser maior que 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }
    const betData: Bet = {
      id: isEditing && id ? id : generateId(),
      date: format(date, "yyyy-MM-dd"),
      tipster,
      competition,
      type,
      homeTeam,
      awayTeam,
      market,
      bookmaker,
      entry,
      odds,
      stake,
      unitValue,
      stakeUnits,
      commission,
      result,
      profitCurrency,
      profitUnits,
    };
    if (isEditing) {
      updateBet(betData);
    } else {
      addBet(betData);
    }
    navigate("/apostas");
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? "Editar Aposta" : "Nova Aposta"}
        subtitle={
          isEditing
            ? "Atualize os detalhes da aposta"
            : "Adicione uma nova aposta"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Apostas", href: "/apostas" },
          { label: isEditing ? "Editar Aposta" : "Nova Aposta" },
        ]}
      />
      <Card className="mb-8 animate-fade-in">
        <CardHeader>
          <CardTitle>Detalhes da Aposta</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date
                        ? format(date, "PPP", { locale: ptBR })
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipster */}
              <div className="space-y-2">
                <Label htmlFor="tipster">Tipster</Label>
                <SearchableSelect
                  value={tipster}
                  onValueChange={setTipster}
                  options={tipsters}
                  placeholder="Selecione o tipster"
                  error={errors.tipster}
                />
                {errors.tipster && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.tipster}
                  </p>
                )}
              </div>

              {/* Competition */}
              <div className="space-y-2">
                <Label htmlFor="competition">Competição</Label>
                <SearchableSelect
                  value={competition}
                  onValueChange={setCompetition}
                  options={competitions}
                  placeholder="Selecione a competição"
                  error={errors.competition}
                />
                {errors.competition && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.competition}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as BetType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pré">Pré</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Combo">Combo</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Home Team */}
              <div className="space-y-2">
                <Label htmlFor="homeTeam">Time Mandante</Label>
                <SearchableSelect
                  value={homeTeam}
                  onValueChange={setHomeTeam}
                  options={teams}
                  placeholder="Selecione o time mandante"
                  error={errors.homeTeam}
                />
                {errors.homeTeam && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.homeTeam}
                  </p>
                )}
              </div>

              {/* Away Team */}
              <div className="space-y-2">
                <Label htmlFor="awayTeam">Time Visitante</Label>
                <SearchableSelect
                  value={awayTeam}
                  onValueChange={setAwayTeam}
                  options={teams}
                  placeholder="Selecione o time visitante"
                  error={errors.awayTeam}
                />
                {errors.awayTeam && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.awayTeam}
                  </p>
                )}
              </div>

              {/* Market */}
              <div className="space-y-2">
                <Label htmlFor="market">Mercado</Label>
                <SearchableSelect
                  value={market}
                  onValueChange={setMarket}
                  options={markets}
                  placeholder="Selecione o mercado"
                  error={errors.market}
                />
                {errors.market && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.market}
                  </p>
                )}
              </div>

              {/* Bookmaker */}
              <div className="space-y-2">
                <Label htmlFor="bookmaker">Casa de Apostas</Label>
                <SearchableSelect
                  value={bookmaker}
                  onValueChange={setBookmaker}
                  options={bookmakers}
                  placeholder="Selecione a casa de apostas"
                  error={errors.bookmaker}
                />
                {errors.bookmaker && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.bookmaker}
                  </p>
                )}
              </div>

              {/* Entry */}
              <div className="space-y-2">
                <Label htmlFor="entry">Entrada</Label>
                <Input
                  id="entry"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  className={errors.entry ? "border-danger-500" : ""}
                />
                {errors.entry && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.entry}
                  </p>
                )}
              </div>

              {/* Odds */}
              <div className="space-y-2">
                <Label htmlFor="odds">Odds</Label>
                <Input
                  id="odds"
                  type="number"
                  step="0.01"
                  min="1"
                  value={odds || ""}
                  onChange={(e) => setOdds(parseFloat(e.target.value) || 0)}
                  className={errors.odds ? "border-danger-500" : ""}
                />
                {errors.odds && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.odds}
                  </p>
                )}
              </div>

              {/* Stake */}
              <div className="space-y-2">
                <Label htmlFor="stake">Valor da aposta (R$)</Label>
                <Input
                  id="stake"
                  type="number"
                  step="0.01"
                  min="0"
                  value={stake || ""}
                  onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                  className={errors.stake ? "border-danger-500" : ""}
                />
                {errors.stake && (
                  <p className="text-danger-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.stake}
                  </p>
                )}
                <p className="text-sm text-neutral-500">
                  {stakeUnits.toFixed(2)} unidades
                </p>
              </div>

              {/* Commission */}
              <div className="space-y-2">
                <Label htmlFor="commission">Comissão (opcional)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={commission !== undefined ? commission : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCommission(
                      value === "" ? undefined : parseFloat(value) || 0
                    );
                  }}
                />
              </div>

              {/* Result */}
              <div className="space-y-2">
                <Label htmlFor="result">Resultado</Label>
                <Select
                  value={result || "PENDING"}
                  onValueChange={(value) =>
                    setResult(value === "PENDING" ? null : (value as BetResult))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="GREEN">GREEN</SelectItem>
                    <SelectItem value="RED">RED</SelectItem>
                    <SelectItem value="REEMBOLSO">REEMBOLSO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profit Preview */}
            {result && (
              <div
                className={`p-4 rounded-lg border ${
                  result === "GREEN"
                    ? "bg-success-50 border-success-200 text-success-700"
                    : result === "RED"
                    ? "bg-danger-50 border-danger-200 text-danger-700"
                    : "bg-neutral-50 border-neutral-200 text-neutral-700"
                }`}
              >
                <h4 className="font-medium mb-2">Prévia do resultado</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">Lucro (R$)</p>
                    <p className="text-lg font-semibold">
                      {profitCurrency >= 0 ? "+" : ""}
                      {profitCurrency.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Lucro (unidades)</p>
                    <p className="text-lg font-semibold">
                      {profitUnits >= 0 ? "+" : ""}
                      {profitUnits.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/apostas")}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Atualizar Aposta" : "Adicionar Aposta"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default BetForm;
