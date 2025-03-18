import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBets } from '@/context/BetContext';
import { Team } from '@/types';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

const TeamManager: React.FC = () => {
  const { teams, addTeam, updateTeam, deleteTeam } = useBets();
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCountry, setNewTeamCountry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [editMode, setEditMode] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newTeamName || !newTeamCountry) {
      setError('Nome e país são obrigatórios');
      return;
    }

    try {
      if (editMode && currentTeamId) {
        // Atualiza o time existente
        await updateTeam({
          id: currentTeamId,
          name: newTeamName,
          country: newTeamCountry
        });
      } else {
        // Verifica se o time já existe
        const teamExists = teams.some(
          (team) =>
            team.name.toLowerCase() === newTeamName.toLowerCase() &&
            team.country.toLowerCase() === newTeamCountry.toLowerCase()
        );

        if (teamExists) {
          setError('Este time já existe');
          return;
        }

        // Cria um novo time com ID gerado
        await addTeam({
          id: crypto.randomUUID(),
          name: newTeamName,
          country: newTeamCountry
        });
      }

      setNewTeamName('');
      setNewTeamCountry('');
      setEditMode(false);
      setCurrentTeamId(null);
    } catch (error) {
      console.error("Erro ao manipular time:", error);
      toast.error('Erro ao salvar time');
    }
  };

  const handleEditTeam = (team: Team) => {
    setNewTeamName(team.name);
    setNewTeamCountry(team.country);
    setEditMode(true);
    setCurrentTeamId(team.id);
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      await deleteTeam(id);
    } catch (error) {
      console.error("Erro ao excluir time:", error);
      toast.error('Erro ao excluir time');
    }
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleCancel = () => {
    setNewTeamName('');
    setNewTeamCountry('');
    setEditMode(false);
    setCurrentTeamId(null);
    setError(null);
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Times</CardTitle>
        <CardDescription>
          Adicione, edite ou exclua times do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Nome do Time</Label>
            <Input
              id="teamName"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Ex: Flamengo"
              className={error ? "border-danger-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamCountry">País</Label>
            <Input
              id="teamCountry"
              value={newTeamCountry}
              onChange={(e) => setNewTeamCountry(e.target.value)}
              placeholder="Ex: Brasil"
              className={error ? "border-danger-500" : ""}
            />
            {error && (
              <p className="text-danger-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {error}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button type="submit">
              {editMode ? 'Atualizar Time' : 'Adicionar Time'}
            </Button>
            {editMode && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6">
          <Label htmlFor="searchTeam">Pesquisar</Label>
          <Input
            id="searchTeam"
            placeholder="Pesquisar times..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <h3 className="font-medium my-3">Times Cadastrados</h3>
          {filteredTeams.length === 0 ? (
            <p className="text-muted-foreground">Nenhum time encontrado</p>
          ) : (
            <ul className="space-y-2">
              {filteredTeams.slice(0, visibleCount).map((team) => (
                <li key={team.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span>{team.name} - {team.country}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditTeam(team)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {visibleCount < filteredTeams.length && (
            <div className="mt-4">
              <Button variant="outline" onClick={handleShowMore}>
                Ver mais
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamManager;
