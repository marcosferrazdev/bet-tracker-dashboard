import React, { useState } from "react";
import { useCompetitions } from "@/context/CompetitionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2, X, Check, AlertCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";

export const CompetitionSettings: React.FC = () => {
  const { competitions, addCompetition, deleteCompetition, updateCompetition } =
    useCompetitions();

  const [searchTerm, setSearchTerm] = useState("");
  const [newCompetition, setNewCompetition] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredCompetitions = competitions.filter((comp) =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newCompetition.trim()) {
      setError("Nome da competição é obrigatório");
      return;
    }

    if (competitions.some(comp => comp.name.toLowerCase() === newCompetition.trim().toLowerCase())) {
      setError("Esta competição já existe");
      return;
    }

    await addCompetition(newCompetition.trim());
    setNewCompetition("");
    setError(null);
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleUpdate = async () => {
    if (!editingId || !editingName.trim()) return;
    await updateCompetition(editingId, editingName.trim());
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (id: string) => {
    await deleteCompetition(id);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="competitionName">Nome da Competição</Label>
          <div className="flex space-x-2">
            <Input
              id="competitionName"
              value={newCompetition}
              onChange={(e) => {
                setNewCompetition(e.target.value);
                setError(null);
              }}
              placeholder="Digite o nome da competição"
              className={error ? "border-danger-500" : ""}
            />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar competições..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredCompetitions.map((competition) => (
            <div
              key={competition.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              {editingId === competition.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleUpdate}
                      className="h-8 w-8"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-sm text-card-foreground">{competition.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(competition.id, competition.name)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(competition.id)}
                      className="h-8 w-8 text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredCompetitions.length === 0 && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Nenhuma competição encontrada
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir competição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta competição? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteId!)}
              className="bg-danger hover:bg-danger/90 text-danger-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 