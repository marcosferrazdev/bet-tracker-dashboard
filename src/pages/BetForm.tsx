import React, { useState, useEffect } from "react";
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
  const [customTipster, setCustomTipster] = useState("");
  const [competition, setCompetition] = useState("");
  const [customCompetition, setCustomCompetition] = useState("");
  const [type, setType] = useState<BetType>("PRÉ");
  const [homeTeam, setHomeTeam] = useState("");
  const [customHomeTeam, setCustomHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [customAwayTeam, setCustomAwayTeam] = useState("");
  const [market, setMarket] = useState("");
  const [customMarket, setCustomMarket] = useState("");
  const [bookmaker, setBookmaker] = useState("");
  const [customBookmaker, setCustomBookmaker] = useState("");
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
    // If editing, load the bet data
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

  // Handle custom value changes
  useEffect(() => {
    if (tipster === "custom" && customTipster) {
      setTipster(customTipster);
    }
    if (competition === "custom" && customCompetition) {
      setCompetition(customCompetition);
    }
    if (homeTeam === "custom-home" && customHomeTeam) {
      setHomeTeam(customHomeTeam);
    }
    if (awayTeam === "custom-away" && customAwayTeam) {
      setAwayTeam(customAwayTeam);
    }
    if (market === "custom" && customMarket) {
      setMarket(customMarket);
    }
    if (bookmaker === "custom-bookmaker" && customBookmaker) {
      setBookmaker(customBookmaker);
    }
  }, [
    customTipster,
    customCompetition,
    customHomeTeam,
    customAwayTeam,
    customMarket,
    customBookmaker,
  ]);

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
      type, // permanece "type"
      homeTeam, // permanece "homeTeam"
      awayTeam, // permanece "awayTeam"
      market,
      bookmaker,
      entry,
      odds,
      stake,
      unitValue, // permanece "unitValue"
      stakeUnits, // permanece "stakeUnits"
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
                      {date ? (
                        format(date, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
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
                <Select value={tipster} onValueChange={setTipster}>
                  <SelectTrigger
                    className={errors.tipster ? "border-danger-500" : ""}
                  >
                    <SelectValue placeholder="Selecione o tipster" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {tipsters.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                {tipster === "custom" && (
                  <Input
                    className="mt-2"
                    placeholder="Digite o nome do tipster"
                    value={customTipster}
                    onChange={(e) => setCustomTipster(e.target.value)}
                  />
                )}
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
                <Select value={competition} onValueChange={setCompetition}>
                  <SelectTrigger
                    className={errors.competition ? "border-danger-500" : ""}
                  >
                    <SelectValue placeholder="Selecione a competição" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {competitions.map((comp) => (
                      <SelectItem key={comp.id} value={comp.name}>
                        {comp.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Outra competição</SelectItem>
                  </SelectContent>
                </Select>
                {competition === "custom" && (
                  <Input
                    className="mt-2"
                    placeholder="Digite o nome da competição"
                    value={customCompetition}
                    onChange={(e) => setCustomCompetition(e.target.value)}
                  />
                )}
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
                    <SelectItem value="PRÉ">PRÉ</SelectItem>
                    <SelectItem value="LIVE">LIVE</SelectItem>
                    <SelectItem value="COMBO">COMBO</SelectItem>
                    <SelectItem value="OUTROS">OUTROS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Home Team */}
              <div className="space-y-2">
                <Label htmlFor="homeTeam">Time Mandante</Label>
                <Select value={homeTeam} onValueChange={setHomeTeam}>
                  <SelectTrigger
                    className={errors.homeTeam ? "border-danger-500" : ""}
                  >
                    <SelectValue placeholder="Selecione o time mandante" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom-home">Outro time</SelectItem>
                  </SelectContent>
                </Select>
                {homeTeam === "custom-home" && (
                  <Input
                    className="mt-2"
                    placeholder="Digite o nome do time mandante"
                    value={customHomeTeam}
                    onChange={(e) => setCustomHomeTeam(e.target.value)}
                  />
                )}
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
                <Select value={awayTeam} onValueChange={setAwayTeam}>
                  <SelectTrigger
                    className={errors.awayTeam ? "border-danger-500" : ""}
                  >
                    <SelectValue placeholder="Selecione o time visitante" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom-away">Outro time</SelectItem>
                  </SelectContent>
                </Select>
                {awayTeam === "custom-away" && (
                  <Input
                    className="mt-2"
                    placeholder="Digite o nome do time visitante"
                    value={customAwayTeam}
                    onChange={(e) => setCustomAwayTeam(e.target.value)}
                  />
                )}
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
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger
                    className={errors.market ? "border-danger-500" : ""}
                  >
                    <SelectValue placeholder="Selecione o mercado" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {markets.map((m) => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                {market === "custom" && (
                  <Input
                    className="mt-2"
                    placeholder="Digite o nome do mercado"
                    value={customMarket}
                    onChange={(e) => setCustomMarket(e.target.value)}
                  />
                )}
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
                <Select value={bookmaker} onValueChange={setBookmaker}>
                  <SelectTrigger
                    className={errors.bookmaker ? "border-danger-500" : ""}
                  >
                    <SelectValue placeholder="Selecione a casa de apostas" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {bookmakers.map((bookie) => (
                      <SelectItem key={bookie.id} value={bookie.name}>
                        {bookie.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom-bookmaker">Outra casa</SelectItem>
                  </SelectContent>
                </Select>
                {bookmaker === "custom-bookmaker" && (
                  <Input
                    className="mt-2"
                    placeholder="Digite o nome da casa de apostas"
                    value={customBookmaker}
                    onChange={(e) => setCustomBookmaker(e.target.value)}
                  />
                )}
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
