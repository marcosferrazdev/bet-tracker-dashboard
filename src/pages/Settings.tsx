import PageHeader from '@/components/PageHeader';
import MarketManager from '@/components/settings/MarketManager';
import TipsterManager from '@/components/settings/TipsterManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBets } from '@/context/BetContext';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import BookmakerManager from '../components/settings/BookmarkerManager';
import TeamManager from '../components/settings/TeamManager';
import { CompetitionSettings } from "@/components/settings/CompetitionSettings";

const Settings: React.FC = () => {
  const { unitValue, setUnitValue } = useBets();
  const [newUnitValue, setNewUnitValue] = useState(unitValue);
  const [error, setError] = useState<string | null>(null);

  // Carrega o valor da unidade do banco de dados
  useEffect(() => {
    const fetchUnitValue = async () => {
      const { data, error } = await supabase
        .from('unit_values')
        .select('value')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum valor encontrado, podemos inicializar com 0 ou outro valor padrão
          setNewUnitValue(0);
        } else {
          toast.error('Erro ao carregar valor da unidade');
        }
        return;
      }
      setNewUnitValue(data.value);
      setUnitValue(data.value); // Atualiza o contexto
    };

    fetchUnitValue();
  }, [setUnitValue]);
  
  const handleUnitValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUnitValue(parseFloat(e.target.value));
    setError(null);
  };

  const saveUnitValue = async () => {
    if (isNaN(newUnitValue) || newUnitValue <= 0) {
      setError('O valor da unidade deve ser maior que 0');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Verifica se já existe um registro para este usuário
      const { data: existingData, error: selectError } = await supabase
        .from('unit_values')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existingData) {
        // Atualiza o registro existente
        const { error: updateError } = await supabase
          .from('unit_values')
          .update({ value: newUnitValue })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Cria um novo registro
        const { error: insertError } = await supabase
          .from('unit_values')
          .insert({
            id: crypto.randomUUID(),
            value: newUnitValue,
            user_id: user.id
          });

        if (insertError) throw insertError;
      }

      setUnitValue(newUnitValue);
      toast.success('Valor da unidade atualizado com sucesso!');
      setError(null);
    } catch (error) {
      console.error('Erro ao salvar valor da unidade:', error);
      toast.error('Erro ao salvar valor da unidade');
      setError('Erro ao salvar valor da unidade');
    }
  };

  return (
    <div>
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie as configurações do sistema"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Configurações' }
        ]}
      />
      
      <Tabs defaultValue="general" className="mb-8">
        <TabsList className="mb-6 flex flex-wrap gap-2">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="tipsters">Tipsters</TabsTrigger>
          <TabsTrigger value="markets">Mercados</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="bookmakers">Casas</TabsTrigger>
          <TabsTrigger value="competitions">Competições</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Valor da Unidade</CardTitle>
              <CardDescription>
                Define o valor base para calcular suas apostas em unidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unitValue">Valor da Unidade (R$)</Label>
                  <Input
                    id="unitValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newUnitValue}
                    onChange={handleUnitValueChange}
                    className={error ? "border-danger-500" : ""}
                  />
                  {error && (
                    <p className="text-danger-500 text-sm flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveUnitValue}>Salvar</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tipsters">
          <TipsterManager />
        </TabsContent>
        
        <TabsContent value="markets">
          <MarketManager />
        </TabsContent>

        <TabsContent value="teams">
          <TeamManager />
        </TabsContent>

        <TabsContent value="bookmakers">
          <BookmakerManager />
        </TabsContent>

        <TabsContent value="competitions">
          <Card>
            <CardHeader>
              <CardTitle>Competições</CardTitle>
              <CardDescription>
                Gerencie as competições disponíveis para suas apostas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitionSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
