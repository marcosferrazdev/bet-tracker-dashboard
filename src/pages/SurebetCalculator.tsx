import PageHeader from '@/components/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';

interface Bet {
  odds: number;
  stake: number;
  profit: number;
  maxStake: number;
}

const SurebetCalculator: React.FC = () => {
  const [investment, setInvestment] = useState<number>(1000);
  const [bet1, setBet1] = useState<Bet>({ odds: 0, stake: 0, profit: 0, maxStake: 0 });
  const [bet2, setBet2] = useState<Bet>({ odds: 0, stake: 0, profit: 0, maxStake: 0 });
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [surebetPercentage, setSurebetPercentage] = useState<number>(0);
  const [guaranteedProfit, setGuaranteedProfit] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Calcula a stake necessária na outra aposta quando uma stake máxima é definida
  const calculateRequiredStake = (bet: Bet, otherBet: Bet) => {
    if (bet.odds <= 1 || otherBet.odds <= 1 || bet.maxStake <= 0) return null;

    const percentage = (1 / bet.odds + 1 / otherBet.odds) * 100;
    if (percentage >= 100) return null;

    // Calcula o investimento total necessário baseado na proporção
    const totalRequired = bet.maxStake * (1 + (bet.odds / otherBet.odds));
    const requiredStake = totalRequired - bet.maxStake;

    return {
      requiredStake,
      totalRequired,
      profit: (bet.maxStake * bet.odds) - totalRequired
    };
  };

  // Atualiza cálculos quando a stake máxima da Aposta 1 muda
  const handleMaxStake1Change = (value: number) => {
    const newBet1 = { ...bet1, maxStake: value };
    setBet1(newBet1);
    
    if (value > 0 && bet2.odds > 1) {
      const result = calculateRequiredStake(newBet1, bet2);
      if (result) {
        setTotalInvestment(result.totalRequired);
        setBet2({ ...bet2, stake: result.requiredStake });
        setGuaranteedProfit(result.profit);
        setInvestment(result.totalRequired);
      }
    }
  };

  // Atualiza cálculos quando a stake máxima da Aposta 2 muda
  const handleMaxStake2Change = (value: number) => {
    const newBet2 = { ...bet2, maxStake: value };
    setBet2(newBet2);
    
    if (value > 0 && bet1.odds > 1) {
      const result = calculateRequiredStake(newBet2, bet1);
      if (result) {
        setTotalInvestment(result.totalRequired);
        setBet1({ ...bet1, stake: result.requiredStake });
        setGuaranteedProfit(result.profit);
        setInvestment(result.totalRequired);
      }
    }
  };

  const calculateSurebet = () => {
    setError('');
    
    if (bet1.odds <= 1 || bet2.odds <= 1) {
      setError('As odds devem ser maiores que 1');
      return;
    }

    if (investment <= 0) {
      setError('O investimento deve ser maior que 0');
      return;
    }

    // Calcula a porcentagem de surebet
    const percentage = (1 / bet1.odds + 1 / bet2.odds) * 100;
    setSurebetPercentage(percentage);

    if (percentage >= 100) {
      setError('Não há oportunidade de surebet. A soma das probabilidades é maior que 100%.');
      setGuaranteedProfit(0);
      setTotalInvestment(0);
      setBet1({ ...bet1, stake: 0, profit: 0 });
      setBet2({ ...bet2, stake: 0, profit: 0 });
      return;
    }

    setTotalInvestment(investment);    // Calcula as stakes ideais considerando os limites máximos
    let stake1 = (investment * (1 / bet1.odds)) / (1 / bet1.odds + 1 / bet2.odds);
    let stake2 = investment - stake1;

    // Ajusta as stakes se excederem os limites máximos
    if (bet1.maxStake > 0 && stake1 > bet1.maxStake) {
      // Se a stake1 exceder o máximo, ajusta para o máximo e recalcula a stake2
      stake1 = bet1.maxStake;
      // Calcula o novo investimento total necessário baseado na proporção
      const totalRequired = stake1 * (1 + (bet1.odds / bet2.odds));
      stake2 = totalRequired - stake1;
    } else if (bet2.maxStake > 0 && stake2 > bet2.maxStake) {
      // Se a stake2 exceder o máximo, ajusta para o máximo e recalcula a stake1
      stake2 = bet2.maxStake;
      // Calcula o novo investimento total necessário baseado na proporção
      const totalRequired = stake2 * (1 + (bet2.odds / bet1.odds));
      stake1 = totalRequired - stake2;
    }

    // Atualiza o investimento total real
    const realInvestment = stake1 + stake2;
    setTotalInvestment(realInvestment);

    // Atualiza os estados com as stakes calculadas
    setBet1({ ...bet1, stake: stake1, profit: stake1 * bet1.odds - realInvestment });
    setBet2({ ...bet2, stake: stake2, profit: stake2 * bet2.odds - realInvestment });

    // Calcula o lucro garantido
    const profit = (stake1 * bet1.odds) - investment;
    setGuaranteedProfit(profit);
  };

  const isSurebetOpportunity = surebetPercentage > 0 && surebetPercentage < 100;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">      <PageHeader
        title="Calculadora de Surebet"
        subtitle="Calcule apostas com lucro garantido"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Aposta 1
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insira a odd da primeira casa de apostas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="odds1">Odd</Label>
                <Input
                  id="odds1"
                  type="number"
                  step="0.01"
                  value={bet1.odds || ''}                  onChange={(e) => {
                    const newBet1 = { ...bet1, odds: parseFloat(e.target.value) };
                    setBet1(newBet1);
                    if (bet2.maxStake > 0) {
                      const result = calculateRequiredStake(bet2, newBet1);
                      if (result) {
                        setTotalInvestment(result.totalRequired);
                        setBet1({ ...newBet1, stake: result.requiredStake });
                        setGuaranteedProfit(result.profit);
                        setInvestment(result.totalRequired);
                      }
                    }
                  }}
                  placeholder="Digite a odd"
                  min="1.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStake1" className="flex items-center gap-2">
                  Stake Máxima
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Valor máximo permitido pela casa de apostas (opcional)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="maxStake1"
                  type="number"
                  step="0.01"                  value={bet1.maxStake || ''}
                  onChange={(e) => handleMaxStake1Change(parseFloat(e.target.value))}
                  placeholder="Stake máxima (opcional)"
                  min="0"
                />
              </div>
            </div>
            {bet1.stake > 0 && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label>Stake Recomendada</Label>
                <p className="text-lg font-semibold">R$ {bet1.stake.toFixed(2)}</p>
                <Label>Retorno Potencial</Label>
                <p className="text-lg font-semibold text-green-600">R$ {(bet1.stake * bet1.odds).toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Aposta 2
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insira a odd da segunda casa de apostas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="odds2">Odd</Label>
                <Input
                  id="odds2"
                  type="number"
                  step="0.01"
                  value={bet2.odds || ''}                  onChange={(e) => {
                    const newBet2 = { ...bet2, odds: parseFloat(e.target.value) };
                    setBet2(newBet2);
                    if (bet1.maxStake > 0) {
                      const result = calculateRequiredStake(bet1, newBet2);
                      if (result) {
                        setTotalInvestment(result.totalRequired);
                        setBet2({ ...newBet2, stake: result.requiredStake });
                        setGuaranteedProfit(result.profit);
                        setInvestment(result.totalRequired);
                      }
                    }
                  }}
                  placeholder="Digite a odd"
                  min="1.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStake2" className="flex items-center gap-2">
                  Stake Máxima
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Valor máximo permitido pela casa de apostas (opcional)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="maxStake2"
                  type="number"
                  step="0.01"                  value={bet2.maxStake || ''}
                  onChange={(e) => handleMaxStake2Change(parseFloat(e.target.value))}
                  placeholder="Stake máxima (opcional)"
                  min="0"
                />
              </div>
            </div>
            {bet2.stake > 0 && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label>Stake Recomendada</Label>
                <p className="text-lg font-semibold">R$ {bet2.stake.toFixed(2)}</p>
                <Label>Retorno Potencial</Label>
                <p className="text-lg font-semibold text-green-600">R$ {(bet2.stake * bet2.odds).toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Configurações e Resultados
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure o investimento total e veja os resultados do cálculo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="investment">Investimento Total (R$)</Label>
              <Input
                id="investment"
                type="number"
                value={investment}
                onChange={(e) => setInvestment(parseFloat(e.target.value))}
                placeholder="Digite o valor total a investir"
                min="0"
              />
            </div>

            <Button 
              onClick={calculateSurebet}
              className="w-full"
              size="lg"
              variant={isSurebetOpportunity ? "default" : "secondary"}
            >
              Calcular Surebet
            </Button>
            
            {surebetPercentage > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Porcentagem de Surebet
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deve ser menor que 100% para existir oportunidade de surebet</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <p className={`text-lg font-semibold ${surebetPercentage < 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {surebetPercentage.toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Investimento Total</Label>
                  <p className="text-lg font-semibold">R$ {totalInvestment.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Lucro Garantido</Label>
                  <p className={`text-lg font-semibold ${guaranteedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {guaranteedProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {isSurebetOpportunity && (
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Oportunidade de surebet encontrada! Siga as stakes recomendadas para garantir o lucro.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SurebetCalculator;
