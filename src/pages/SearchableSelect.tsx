import React from "react";
import Select, { SingleValue, StylesConfig } from "react-select";

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

interface OptionType {
  value: string;
  label: string;
}

const customStyles: StylesConfig<OptionType, false> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "2.5rem", // 40px
    border: "1px solid",
    borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--border))",
    boxShadow: state.isFocused ? "0 0 0 1px hsl(var(--primary))" : "none",
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    "&:hover": {
      borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--border))",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.375rem",
    marginTop: "0.25rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    zIndex: 9999,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "hsl(var(--accent))" : "hsl(var(--popover))",
    color: state.isFocused ? "hsl(var(--accent-foreground))" : "hsl(var(--popover-foreground))",
    padding: "0.5rem 1rem",
    fontSize: "0.75rem", // diminui a fonte das opções
    cursor: "pointer",
  }),
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Selecione...",
  error,
}) => {
  const selectOptions: OptionType[] = options.map((opt) => ({
    value: opt.name,
    label: opt.name,
  }));

  const selectedOption: OptionType | null =
    selectOptions.find((opt) => opt.value === value) || null;

  const handleChange = (selected: SingleValue<OptionType>) => {
    onValueChange(selected?.value || "");
  };

  return (
    <div>
      <Select<OptionType, false>
        value={selectedOption}
        onChange={handleChange}
        options={selectOptions}
        placeholder={placeholder}
        styles={customStyles}
        isSearchable
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
