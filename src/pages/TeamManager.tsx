import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/services/supabaseClient';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  country: string;
}

const TeamManager: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCountry, setNewTeamCountry] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Carrega times do banco de dados
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar times');
      return;
    }
    setTeams(data);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newTeamName || !newTeamCountry) {
      setError('Nome e país são obrigatórios');
      return;
    }

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

    const { error } = await supabase
      .from('teams')
      .insert([{ name: newTeamName, country: newTeamCountry }]);

    if (error) {
      toast.error('Erro ao adicionar time');
      return;
    }

    toast.success('Time adicionado com sucesso!');
    setNewTeamName('');
    setNewTeamCountry('');
    fetchTeams(); // Atualiza a lista interna para verificar duplicatas
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Times</CardTitle>
        <CardDescription>
          Adicione novos times ao sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTeam} className="space-y-4">
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

          <Button type="submit">Adicionar Time</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TeamManager;