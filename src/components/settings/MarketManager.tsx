
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBets } from '@/context/BetContext';
import { generateId } from '@/lib/bet-utils';
import { Market } from '@/types';
import { AlertCircle, Edit, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

const MarketManager: React.FC = () => {
  const { markets, addMarket, updateMarket, deleteMarket } = useBets();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('O nome do mercado é obrigatório');
      return;
    }

    if (editMode && currentId) {
      updateMarket({ id: currentId, name });
    } else {
      addMarket({ id: generateId(), name });
    }

    // Reset form
    setName('');
    setEditMode(false);
    setCurrentId(null);
  };

  const handleEdit = (market: Market) => {
    setName(market.name);
    setCurrentId(market.id);
    setEditMode(true);
  };

  const handleCancel = () => {
    setName('');
    setEditMode(false);
    setCurrentId(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Mercados</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marketName">Nome do Mercado</Label>
            <div className="flex space-x-2">
              <Input
                id="marketName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do mercado"
                className={error ? "border-danger-500" : ""}
              />
              <Button type="submit" size="sm">
                {editMode ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {editMode ? 'Atualizar' : 'Adicionar'}
              </Button>
              {editMode && (
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
            </div>
            {error && (
              <p className="text-danger-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {error}
              </p>
            )}
          </div>
        </form>

        <div className="mt-6">
          <h3 className="font-medium mb-3">Mercados Cadastrados</h3>
          {markets.length === 0 ? (
            <p className="text-muted-foreground">Nenhum mercado cadastrado</p>
          ) : (
            <ul className="space-y-2">
              {markets.map((market) => (
                <li 
                  key={market.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <span>{market.name}</span>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(market)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteMarket(market.id)}
                      className="text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketManager;
