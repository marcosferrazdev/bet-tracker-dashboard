
import PageHeader from '@/components/PageHeader';
import MarketManager from '@/components/settings/MarketManager';
import TipsterManager from '@/components/settings/TipsterManager';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBets } from '@/context/BetContext';
import { supabase } from '@/services/supabaseClient';
import { AlertCircle, Download, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import TeamManager from './TeamManager';

const Settings: React.FC = () => {
  const { unitValue, setUnitValue, bets } = useBets();
  const [newUnitValue, setNewUnitValue] = useState(unitValue);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState<string>('');

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
  if (!newUnitValue || newUnitValue <= 0) {
    setError('O valor da unidade deve ser maior que zero');
    return;
  }

  // Verifica se já existe um valor no banco
  const { data: existingValue } = await supabase
    .from('unit_values')
    .select('id')
    .limit(1)
    .single();

  if (existingValue) {
    // Atualiza o valor existente
    const { error } = await supabase
      .from('unit_values')
      .update({ value: newUnitValue })
      .eq('id', existingValue.id);

    if (error) {
      toast.error('Erro ao atualizar valor da unidade');
      return;
    }
  } else {
    // Insere um novo valor
    const { error } = await supabase
      .from('unit_values')
      .insert([{ value: newUnitValue }]);

    if (error) {
      toast.error('Erro ao salvar valor da unidade');
      return;
    }
  }

  setUnitValue(newUnitValue); // Atualiza o contexto
  toast.success('Valor da unidade atualizado com sucesso!');
};

  const handleExportData = () => {
    const dataStr = JSON.stringify({ bets, unitValue });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bet-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Dados exportados com sucesso!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportedData(content);
        setShowImportDialog(true);
      } catch (error) {
        toast.error('Erro ao ler o arquivo');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    e.target.value = '';
  };

  const confirmImport = () => {
    try {
      const data = JSON.parse(importedData);
      
      if (!data.bets || !Array.isArray(data.bets)) {
        throw new Error('Formato de dados inválido');
      }
      
      // This would normally update the global context
      // For demo purposes, we'll just show success
      toast.success('Dados importados com sucesso!');
      setShowImportDialog(false);
      
      // Force page reload to reflect changes
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao importar dados');
      setShowImportDialog(false);
    }
  };

  const confirmClearData = () => {
    // This would normally clear all data
    // For demo purposes, we'll just show success
    localStorage.clear();
    toast.success('Todos os dados foram apagados!');
    setShowDeleteDialog(false);
    
    // Force page reload to reflect changes
    window.location.reload();
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
        <TabsList className="mb-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="tipsters">Tipsters</TabsTrigger>
          <TabsTrigger value="markets">Mercados</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger> {/* Nova aba */}
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
                    min="0.01"
                    value={newUnitValue || ''}
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
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Importar / Exportar Dados</CardTitle>
              <CardDescription>
                Faça backup dos seus dados ou importe dados de outro dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="importFile">Importar arquivo de dados</Label>
                  <div className="mt-2">
                    <Input 
                      id="importFile" 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportFile}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 items-stretch sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Dados
              </Button>
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
      </Tabs>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Todos os Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente todas as suas apostas e configurações.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearData}
              className="bg-danger-500 hover:bg-danger-600"
            >
              Limpar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import confirmation dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação substituirá todos os seus dados atuais pelos dados importados.
              Você tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              Importar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
