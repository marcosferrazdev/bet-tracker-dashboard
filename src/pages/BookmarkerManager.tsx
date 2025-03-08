import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/services/supabaseClient';
import React, { useState } from 'react';
import { toast } from 'sonner';

const BookmakerManager: React.FC = () => {
  const [newBookmakerName, setNewBookmakerName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleAddBookmaker = async () => {
    if (!newBookmakerName.trim()) {
      toast.error('O nome da casa é obrigatório');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from('bookmakers')
      .insert([{ name: newBookmakerName.trim(), is_licensed: true }]);
    
    if (error) {
      toast.error('Erro ao cadastrar a casa');
    } else {
      toast.success('Casa cadastrada com sucesso!');
      setNewBookmakerName('');
    }
    setLoading(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar Casa</CardTitle>
        <CardDescription>Adicione uma nova casa de apostas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookmakerName">Nome da Casa</Label>
            <Input
              id="bookmakerName"
              type="text"
              value={newBookmakerName}
              onChange={(e) => setNewBookmakerName(e.target.value)}
              placeholder="Digite o nome da casa"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAddBookmaker} disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Casa'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookmakerManager;
