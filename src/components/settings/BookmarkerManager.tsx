import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBets } from '@/context/BetContext';
import { Bookmaker } from '@/types';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

const BookmakerManager: React.FC = () => {
  const { bookmakers, addBookmaker, updateBookmaker, deleteBookmaker } = useBets();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('O nome da casa é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (editMode && currentId) {
        await updateBookmaker({ id: currentId, name: name.trim() });
      } else {
        await addBookmaker({ id: crypto.randomUUID(), name: name.trim() } as Bookmaker);
      }
    } finally {
      setLoading(false);
      setName('');
      setEditMode(false);
      setCurrentId(null);
    }
  };

  const handleEdit = (bookmaker: Bookmaker) => {
    setName(bookmaker.name);
    setCurrentId(bookmaker.id);
    setEditMode(true);
  };

  const handleCancel = () => {
    setName('');
    setEditMode(false);
    setCurrentId(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteBookmaker(id);
      // Limpa o campo de pesquisa após a exclusão
      setSearchQuery('');
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
                {error}
              </p>
            )}
          </div>
        </form>

        <div className="mt-6">
          <Label htmlFor="searchBookmaker">Pesquisar</Label>
          <Input
            id="searchBookmaker"
            placeholder="Pesquisar casas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <h3 className="font-medium mb-3">Casas Cadastradas</h3>
          {loading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
              <span className="ml-2 text-neutral-600">Carregando casas...</span>
            </div>
          ) : filteredBookmakers.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma casa encontrada</p>
          ) : (
            <ul className="space-y-2">
              {filteredBookmakers.slice(0, visibleCount).map((bookmaker) => (
                <li
                  key={bookmaker.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <span>{bookmaker.name}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(bookmaker)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bookmaker.id)}
                      className="text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {visibleCount < filteredBookmakers.length && (
            <div className="mt-4">
              <Button variant="outline" onClick={handleShowMore}>
                Ver mais
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
};

export default BookmakerManager;
