import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useMemo, useState } from "react";

export interface OptionItem {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: OptionItem[];
  placeholder?: string;
  error?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "",
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizeString = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedQuery = normalizeString(searchQuery);
    return options.filter((option) =>
      normalizeString(option.name).includes(normalizedQuery)
    );
  }, [options, searchQuery]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={error ? "border-danger-500" : ""}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Container para o input de busca */}
        <div className="p-2">
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onFocusCapture={(e) => e.stopPropagation()}
          />
        </div>
        {filteredOptions.map((option) => (
          <SelectItem key={option.id} value={option.name}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SearchableSelect;
