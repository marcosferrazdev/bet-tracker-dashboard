import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBets } from '@/context/BetContext';
import { Bookmaker } from '@/types';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

const BookmarkerManager: React.FC = () => {
  const { bookmakers, addBookmaker, updateBookmaker, deleteBookmaker } = useBets();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('O nome da casa de apostas é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Verifica se já existe uma casa com o mesmo nome para o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado!');
        return;
      }

      // Verifica se já existe uma casa com o mesmo nome para este usuário
      const { data: existingBookmaker, error: checkError } = await supabase
        .from('bookmakers')
        .select('id')
        .eq('name', name.trim())
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingBookmaker) {
        setError('Já existe uma casa de apostas com este nome');
        return;
      }

      if (editMode && editingId) {
        await updateBookmaker({
          id: editingId,
          name: name.trim(),
        });
        toast.success('Casa de apostas atualizada com sucesso!');
      } else {
        await addBookmaker({
          id: crypto.randomUUID(),
          name: name.trim(),
        });
        toast.success('Casa de apostas adicionada com sucesso!');
      }
      setName('');
      setEditMode(false);
      setEditingId(null);
    } catch (error: any) {
      console.error('Erro ao salvar casa de apostas:', error);
      if (error.code === '23505') {
        setError('Já existe uma casa de apostas com este nome');
      } else {
        toast.error('Erro ao salvar casa de apostas');
        setError('Erro ao salvar casa de apostas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bookmaker: { id: string; name: string }) => {
    setName(bookmaker.name);
    setEditMode(true);
    setEditingId(bookmaker.id);
  };

  const handleCancel = () => {
    setName('');
    setEditMode(false);
    setEditingId(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteBookmaker(id);
      toast.success('Casa de apostas removida com sucesso!');
      setSearchQuery('');
    } catch (error) {
      console.error('Erro ao remover casa de apostas:', error);
      toast.error('Erro ao remover casa de apostas');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookmakers = bookmakers.filter((bookmaker) =>
    bookmaker?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Casas</CardTitle>
        <CardDescription>Adicione, edite ou exclua casas de apostas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookmakerName">Nome da Casa</Label>
            <div className="flex space-x-2">
              <Input
                id="bookmakerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome da casa"
                className={error ? "border-danger-500" : ""}
              />
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : editMode ? (
                  <Edit className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {loading ? "Carregando..." : editMode ? "Atualizar" : "Adicionar"}
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

        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar casa de apostas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-2">
            {filteredBookmakers.slice(0, visibleCount).map((bookmaker) => (
              <div
                key={bookmaker.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <span>{bookmaker.name}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(bookmaker)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bookmaker.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredBookmakers.length > visibleCount && (
            <Button
              variant="outline"
              onClick={handleShowMore}
              className="w-full"
            >
              Mostrar mais
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookmarkerManager;
