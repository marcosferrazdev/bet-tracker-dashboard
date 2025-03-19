import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogPortal,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Estilos personalizados para o DatePicker
const customStyles = {
  input: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
  calendar: "!bg-white !border !border-gray-200 !rounded-lg !shadow-lg !p-4",
  header: "!flex !justify-between !items-center !mb-4",
  month: "!text-lg !font-semibold !text-gray-900",
  navButton: "!p-2 !hover:bg-gray-100 !rounded-full",
  navButtonPrev: "!mr-2",
  navButtonNext: "!ml-2",
  weekdays: "!flex !justify-between !mb-2",
  weekday: "!text-sm !text-gray-500 !w-8 !text-center",
  days: "!grid !grid-cols-7 !gap-1",
  day: "!w-8 !h-8 !flex !items-center !justify-center !rounded-full !text-sm !hover:bg-gray-100",
  daySelected: "!bg-primary-500 !text-white !hover:bg-primary-600",
  dayOutside: "!text-gray-400",
  dayDisabled: "!text-gray-300 !cursor-not-allowed",
  dayToday: "!font-semibold",
  dayHighlighted: "!bg-primary-100 !text-primary-700",
};

// Estilos globais para sobrescrever os estilos padrão do react-datepicker
const globalStyles = `
  .react-datepicker {
    font-family: inherit !important;
    border: none !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
    width: 100% !important;
    max-width: 320px !important;
  }
  .react-datepicker__header {
    background-color: white !important;
    border-bottom: none !important;
    padding-top: 0 !important;
  }
  .react-datepicker__month-container {
    float: none !important;
    width: 100% !important;
  }
  .react-datepicker__month {
    margin: 0 !important;
    width: 100% !important;
  }
  .react-datepicker__week {
    display: flex !important;
    justify-content: space-between !important;
    width: 100% !important;
  }
  .react-datepicker__day-names {
    display: flex !important;
    justify-content: space-between !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .react-datepicker__day-name {
    color: #6B7280 !important;
    width: 2rem !important;
    margin: 0 !important;
    font-weight: 500 !important;
    text-align: center !important;
  }
  .react-datepicker__day {
    width: 2rem !important;
    height: 2rem !important;
    line-height: 2rem !important;
    margin: 0 !important;
    border-radius: 9999px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .react-datepicker__day:hover {
    background-color: #F3F4F6 !important;
    color: #111827 !important;
  }
  .react-datepicker__day--selected {
    background-color: #3B82F6 !important;
    color: white !important;
  }
  .react-datepicker__day--selected:hover {
    background-color: #2563EB !important;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #EFF6FF !important;
    color: #3B82F6 !important;
  }
  .react-datepicker__day--outside-month {
    color: #9CA3AF !important;
  }
  .react-datepicker__day--disabled {
    color: #D1D5DB !important;
    cursor: not-allowed !important;
  }
  .react-datepicker__navigation {
    top: 0.5rem !important;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #6B7280 !important;
  }
  .react-datepicker__current-month {
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: #111827 !important;
    text-align: center !important;
    width: 100% !important;
  }
`;

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
  useEffect(() => {
    // Adiciona os estilos globais ao documento
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.body.style.removeProperty('pointer-events');
      document.body.style.removeProperty('overflow');
      document.head.removeChild(styleElement);
    };
  }, []);

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

  const handleApply = () => {
    document.body.style.removeProperty('pointer-events');
    document.body.style.removeProperty('overflow');
    onApply();
    onOpenChange(false);
  };

  const handleCancel = () => {
    document.body.style.removeProperty('pointer-events');
    document.body.style.removeProperty('overflow');
    onCancel();
    onOpenChange(false);
  };

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          document.body.style.removeProperty('pointer-events');
          document.body.style.removeProperty('overflow');
        }
        onOpenChange(newOpen);
      }}
    >
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-black/20" />
        <AlertDialogContent className="rounded-xl max-w-md w-[95vw] sm:w-full mx-auto p-4">
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
                    <DatePicker
                      selected={tempStartDate}
                      onChange={setTempStartDate}
                      dateFormat="dd/MM/yyyy"
                      locale={ptBR}
                      className={customStyles.input}
                      placeholderText="Selecione a data"
                      calendarClassName={customStyles.calendar}
                      dayClassName={() => customStyles.day}
                      weekDayClassName={() => customStyles.weekday}
                      highlightDates={tempEndDate ? [{ "react-datepicker__day--highlighted": [tempEndDate] }] : []}
                      popperClassName="!z-50"
                      popperPlacement="bottom-start"
                      popperModifiers={[
                        {
                          name: "offset",
                          options: {
                            offset: [0, 8],
                          },
                          fn: () => ({ x: 0, y: 8 }),
                        },
                      ]}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="endDate" className="text-sm mb-1 block">
                      Data Final
                    </label>
                    <DatePicker
                      selected={tempEndDate}
                      onChange={setTempEndDate}
                      dateFormat="dd/MM/yyyy"
                      locale={ptBR}
                      className={customStyles.input}
                      placeholderText="Selecione a data"
                      minDate={tempStartDate}
                      calendarClassName={customStyles.calendar}
                      dayClassName={() => customStyles.day}
                      weekDayClassName={() => customStyles.weekday}
                      highlightDates={tempStartDate ? [{ "react-datepicker__day--highlighted": [tempStartDate] }] : []}
                      popperClassName="!z-50"
                      popperPlacement="bottom-start"
                      popperModifiers={[
                        {
                          name: "offset",
                          options: {
                            offset: [0, 8],
                          },
                          fn: () => ({ x: 0, y: 8 }),
                        },
                      ]}
                    />
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
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleApply} disabled={isApplyDisabled()}>
                Aplicar
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
};

export default FilterModal;
