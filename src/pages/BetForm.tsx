import DatePicker from "@/components/DataPicker";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBets } from "@/context/BetContext";
import { calculateProfit, calculateUnits, generateId } from "@/lib/bet-utils";
import { Bet, BetResult, BetType } from "@/types";
import { format } from "date-fns";
import { AlertCircle, Clock, PlusCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import SearchableSelect from "./SearchableSelect";
import { useCompetitions } from "@/context/CompetitionContext";

interface Game {
  competition: string;
  homeTeam: string;
  awayTeam: string;
}

const BetForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    bets,
    addBet,
    updateBet,
    unitValue,
    tipsters,
    markets,
    bookmakers,
    teams,
  } = useBets();
  const { competitions } = useCompetitions();

  const isEditing = !!id;

  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("");
  const [tipster, setTipster] = useState("");
  const [competition, setCompetition] = useState("");
  const [type, setType] = useState<"Pré" | "Live" | "Múltipla" | "Bingo Múltipla">("Pré");
  const [games, setGames] = useState<Game[]>([
    { competition: "", homeTeam: "", awayTeam: "" },
  ]);
  const [market, setMarket] = useState("");
  const [bookmaker, setBookmaker] = useState("");
  const [entry, setEntry] = useState("");
  const [odds, setOdds] = useState<number>(0);
  const [stake, setStake] = useState<number>(0);
  const [commission, setCommission] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<BetResult>(null);

  // Computed
  const stakeUnits = calculateUnits(stake, unitValue);
  const profitCurrency = calculateProfit(stake, odds, result);
  const profitUnits = calculateUnits(profitCurrency, unitValue);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialViewMode = location.state?.viewMode || "table";

  useEffect(() => {
    if (!isEditing && tipsters.length === 1 && !tipster) {
      setTipster(tipsters[0].name);
    }
  }, [tipsters, isEditing, tipster]);

  useEffect(() => {
    if (isEditing && id) {
      const betToEdit = bets.find((bet) => bet.id === id);
      if (betToEdit) {
        // Garantindo que a data seja válida e extraindo o horário
        const betDate = new Date(betToEdit.date);
        if (!isNaN(betDate.getTime())) {
          setDate(betDate);
          // Extrai o horário no formato "HH:mm" e atualiza o state "time"
          const formattedTime = format(betDate, "HH:mm");
          setTime(formattedTime);
        } else {
          setDate(new Date());
        }
        
        setTipster(betToEdit.tipster);
        setType(betToEdit.type);
        if (
          betToEdit.type === "Múltipla" &&
          betToEdit.comboGames &&
          betToEdit.comboGames.length > 0
        ) {
          setGames([
            {
              competition: betToEdit.competition,
              homeTeam: betToEdit.homeTeam,
              awayTeam: betToEdit.awayTeam,
            },
            ...betToEdit.comboGames.map((game) => ({
              competition: game.competition || "",
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
            })),
          ]);
          setCompetition("");
        } else {
          setGames([
            {
              competition: betToEdit.competition,
              homeTeam: betToEdit.homeTeam,
              awayTeam: betToEdit.awayTeam,
            },
          ]);
          setCompetition(betToEdit.competition);
        }
        setMarket(betToEdit.market);
        setBookmaker(betToEdit.bookmaker);
        setEntry(betToEdit.entry);
        setOdds(betToEdit.odds);
        setStake(betToEdit.stake);
        setCommission(betToEdit.commission);
        setResult(betToEdit.result);
      } else {
        toast.error("Aposta não encontrada");
        navigate("/apostas", { state: { viewMode: initialViewMode } });
      }
    }
  }, [isEditing, id, bets, navigate, initialViewMode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!tipster) newErrors.tipster = "Tipster é obrigatório";
    if (type !== "Múltipla" && type !== "Bingo Múltipla" && !competition)
      newErrors.competition = "Competição é obrigatória";
    if (type !== "Bingo Múltipla") {
      games.forEach((game, index) => {
        if (type === "Múltipla" && !game.competition)
          newErrors[`competition${index}`] = `Competição do Jogo ${index + 1} é obrigatória`;
        if (!game.homeTeam)
          newErrors[`homeTeam${index}`] = `Time mandante do Jogo ${index + 1} é obrigatório`;
        if (!game.awayTeam)
          newErrors[`awayTeam${index}`] = `Time visitante do Jogo ${index + 1} é obrigatório`;
      });
    }
    if (!market) newErrors.market = "Mercado é obrigatório";
    if (!bookmaker) newErrors.bookmaker = "Casa de apostas é obrigatória";
    if (!entry) newErrors.entry = "Entrada é obrigatória";
    if (!odds) newErrors.odds = "Odd é obrigatória";
    if (odds < 1) newErrors.odds = "Odd deve ser maior que 1";
    if (!stake) newErrors.stake = "Valor da aposta é obrigatório";
    if (stake <= 0) newErrors.stake = "Valor da aposta deve ser maior que 0";
    // Horário é obrigatório apenas se o tipo não for "Bingo Múltipla"
    if (type !== "Bingo Múltipla" && !time) newErrors.time = "Horário é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddGame = () => {
    setGames([...games, { competition: "", homeTeam: "", awayTeam: "" }]);
  };

  const handleGameChange = (
    index: number,
    field: "competition" | "homeTeam" | "awayTeam",
    value: string
  ) => {
    const updatedGames = games.map((game, i) =>
      i === index ? { ...game, [field]: value } : game
    );
    setGames(updatedGames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }
    // Combinar data e horário apenas se o horário for preenchido
    const dateTime = time && type !== "Bingo Múltipla"
      ? `${format(date, "yyyy-MM-dd")}T${time}:00`
      : format(date, "yyyy-MM-dd");

    const betData: Bet = {
      id: isEditing && id ? id : generateId(),
      date: dateTime,
      tipster,
      competition: type === "Múltipla" ? games[0].competition : competition,
      type,
      homeTeam: games[0].homeTeam,
      awayTeam: games[0].awayTeam,
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
      ...(type === "Múltipla" && games.length > 1
        ? {
            comboGames: games.slice(1).map((game) => ({
              competition: game.competition,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
            })),
          }
        : {}),
    };
    if (isEditing) {
      updateBet(betData);
    } else {
      addBet(betData);
    }
    navigate("/apostas", { state: { viewMode: initialViewMode } });
  };

  const isCompetitionDisabled = (betType: BetType) => {
    return betType === "Bingo Múltipla" || betType === "Múltipla";
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
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <DatePicker
                      date={date}
                      onDateChange={(newDate) => setDate(newDate)}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={`pl-11 text-sm ${errors.time ? "border-danger" : ""}`}
                      style={{
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        appearance: "none",
                      }}
                      disabled={type === "Bingo Múltipla"} // Desativa o campo de horário para Bingo Múltipla
                    />
                    <style>{`
                      input[type="time"]::-webkit-calendar-picker-indicator {
                        display: none;
                      }
                      input[type="time"]::-webkit-clear-button {
                        display: none;
                      }
                    `}</style>
                  </div>
                </div>
                {errors.time && (
                                  <p className="text-danger text-sm flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.time}
                </p>
                )}
              </div>
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
                  <p className="text-danger text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.tipster}
                  </p>
                )}
              </div>
              {type !== "Múltipla" && type !== "Bingo Múltipla" && (
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
                    <p className="text-danger text-sm flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.competition}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as "Pré" | "Live" | "Múltipla" | "Bingo Múltipla")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pré">Pré</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Múltipla">Múltipla</SelectItem>
                    <SelectItem value="Bingo Múltipla">
                      Bingo Múltipla
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {type === "Múltipla" ? (
                <div className="col-span-1 md:col-span-3 space-y-4">
                  {games.map((game, index) => (
                    <div
                      key={index}
                      className="space-y-2 border p-4 rounded-md"
                    >
                      <h4 className="font-medium text-card-foreground">Jogo {index + 1}</h4>
                      <div className="space-y-2">
                        <Label htmlFor={`competition${index}`}>
                          Competição
                        </Label>
                        <SearchableSelect
                          value={game.competition}
                          onValueChange={(value) =>
                            handleGameChange(index, "competition", value)
                          }
                          options={competitions}
                          placeholder="Selecione a competição"
                          error={errors[`competition${index}`]}
                        />
                        {errors[`competition${index}`] && (
                          <p className="text-danger text-sm flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors[`competition${index}`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`homeTeam${index}`}>
                          Time Mandante
                        </Label>
                        <SearchableSelect
                          value={game.homeTeam}
                          onValueChange={(value) =>
                            handleGameChange(index, "homeTeam", value)
                          }
                          options={teams}
                          placeholder="Selecione o time mandante"
                          error={errors[`homeTeam${index}`]}
                        />
                        {errors[`homeTeam${index}`] && (
                          <p className="text-danger text-sm flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors[`homeTeam${index}`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`awayTeam${index}`}>
                          Time Visitante
                        </Label>
                        <SearchableSelect
                          value={game.awayTeam}
                          onValueChange={(value) =>
                            handleGameChange(index, "awayTeam", value)
                          }
                          options={teams}
                          placeholder="Selecione o time visitante"
                          error={errors[`awayTeam${index}`]}
                        />
                        {errors[`awayTeam${index}`] && (
                          <p className="text-danger text-sm flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors[`awayTeam${index}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddGame}
                    className="w-full"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Jogo
                  </Button>
                </div>
              ) : type === "Bingo Múltipla" ? (
                <div className="col-span-1 md:col-span-3 space-y-2">
                  <Label htmlFor="bingo">Bingo</Label>
                  <Input
                    id="bingo"
                    value={
                      games[0].homeTeam && games[0].awayTeam
                        ? `${games[0].homeTeam} vs ${games[0].awayTeam}`
                        : ""
                    }
                    disabled
                    placeholder="Os times serão preenchidos automaticamente"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="homeTeam">Time Mandante</Label>
                    <SearchableSelect
                      value={games[0].homeTeam}
                      onValueChange={(value) =>
                        handleGameChange(0, "homeTeam", value)
                      }
                      options={teams}
                      placeholder="Selecione o time mandante"
                      error={errors.homeTeam0}
                    />
                    {errors.homeTeam0 && (
                      <p className="text-danger text-sm flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.homeTeam0}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="awayTeam">Time Visitante</Label>
                    <SearchableSelect
                      value={games[0].awayTeam}
                      onValueChange={(value) =>
                        handleGameChange(0, "awayTeam", value)
                      }
                      options={teams}
                      placeholder="Selecione o time visitante"
                      error={errors.awayTeam0}
                    />
                    {errors.awayTeam0 && (
                      <p className="text-danger text-sm flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.awayTeam0}
                      </p>
                    )}
                  </div>
                </>
              )}
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
                  <p className="text-danger text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.market}
                  </p>
                )}
              </div>
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
                  <p className="text-danger text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.bookmaker}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry">Entrada</Label>
                <Input
                  id="entry"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  className={errors.entry ? "border-danger" : ""}
                />
                                  {errors.entry && (
                    <p className="text-danger text-sm flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.entry}
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="odds">Odds</Label>
                <Input
                  id="odds"
                  type="number"
                  step="0.0001"
                  min="1"
                  value={odds || ""}
                  onChange={(e) => setOdds(parseFloat(e.target.value) || 0)}
                  className={errors.odds ? "border-danger" : ""}
                />
                                  {errors.odds && (
                    <p className="text-danger text-sm flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.odds}
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stake">Valor da aposta (R$)</Label>
                <Input
                  id="stake"
                  type="number"
                  step="0.01"
                  min="0"
                  value={stake || ""}
                  onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                  className={errors.stake ? "border-danger" : ""}
                />
                                  {errors.stake && (
                    <p className="text-danger text-sm flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.stake}
                    </p>
                  )}
                                  <p className="text-sm text-muted-foreground">
                    {stakeUnits.toFixed(2)} unidades
                  </p>
              </div>
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
                <h4 className="font-medium mb-2 text-card-foreground">Prévia do resultado</h4>
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
              onClick={() =>
                navigate("/apostas", { state: { viewMode: initialViewMode } })
              }
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
