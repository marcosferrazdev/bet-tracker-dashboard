import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedResults: string[];
  tempSelectedResults: string[];
  setTempSelectedResults: React.Dispatch<React.SetStateAction<string[]>>;
  startDate: Date | undefined;
  endDate: Date | undefined;
  tempStartDate: Date | undefined;
  tempEndDate: Date | undefined;
  setTempStartDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setTempEndDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  onApply: () => void;
  onCancel: () => void;
  isApplyDisabled: () => boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onOpenChange,
  selectedResults,
  tempSelectedResults,
  setTempSelectedResults,
  startDate,
  endDate,
  tempStartDate,
  tempEndDate,
  setTempStartDate,
  setTempEndDate,
  onApply,
  onCancel,
  isApplyDisabled,
}) => {
  const toggleFilter = (value: string) => {
    if (tempSelectedResults.includes(value)) {
      setTempSelectedResults(tempSelectedResults.filter((v) => v !== value));
    } else {
      setTempSelectedResults([...tempSelectedResults, value]);
    }
  };

  const clearDateFilters = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl max-w-md w-full mx-auto p-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Filtrar Apostas</AlertDialogTitle>
          <AlertDialogDescription>
            Selecione os critérios para filtrar suas apostas:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-6 my-4">
          {/* Filtros de Resultado */}
          <div>
            <h3 className="text-sm font-medium mb-2">Resultados</h3>
            <div className="flex flex-col gap-3">
              {["GREEN", "RED", "REEMBOLSO", "Pendente"].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempSelectedResults.includes(status)}
                    onChange={() => toggleFilter(status)}
                    id={status}
                    className="form-checkbox h-4 w-4 text-primary-600 rounded-full"
                  />
                  <label htmlFor={status} className="text-sm cursor-pointer">
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtros de Data */}
          <div>
            <h3 className="text-sm font-medium mb-2">Período</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="startDate" className="text-sm mb-1 block">
                    Data Inicial
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {tempStartDate
                          ? format(tempStartDate, "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={tempStartDate}
                        onSelect={setTempStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <label htmlFor="endDate" className="text-sm mb-1 block">
                    Data Final
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {tempEndDate
                          ? format(tempEndDate, "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={tempEndDate}
                        onSelect={setTempEndDate}
                        initialFocus
                        disabled={(date) =>
                          tempStartDate ? isBefore(date, tempStartDate) : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {(tempStartDate || tempEndDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilters}
                  className="w-full"
                >
                  Limpar datas
                </Button>
              )}
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onApply} disabled={isApplyDisabled()}>
              Aplicar
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FilterModal;
