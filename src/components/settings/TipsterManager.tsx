
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tipster } from '@/types';
import { useBets } from '@/context/BetContext';
import { generateId } from '@/lib/bet-utils';
import { AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';

const TipsterManager: React.FC = () => {
  const { tipsters, addTipster, updateTipster, deleteTipster } = useBets();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('O nome do tipster é obrigatório');
      return;
    }

    if (editMode && currentId) {
      updateTipster({ id: currentId, name });
    } else {
      addTipster({ id: generateId(), name });
    }

    // Reset form
    setName('');
    setEditMode(false);
    setCurrentId(null);
  };

  const handleEdit = (tipster: Tipster) => {
    setName(tipster.name);
    setCurrentId(tipster.id);
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
        <CardTitle>Gerenciar Tipsters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipsterName">Nome do Tipster</Label>
            <div className="flex space-x-2">
              <Input
                id="tipsterName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do tipster"
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
          <h3 className="font-medium mb-3">Tipsters Cadastrados</h3>
          {tipsters.length === 0 ? (
            <p className="text-muted-foreground">Nenhum tipster cadastrado</p>
          ) : (
            <ul className="space-y-2">
              {tipsters.map((tipster) => (
                <li 
                  key={tipster.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <span>{tipster.name}</span>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(tipster)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteTipster(tipster.id)}
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

export default TipsterManager;
