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
    borderColor: state.isFocused ? "#6366F1" : provided.borderColor,
    boxShadow: state.isFocused ? "0 0 0 1px #6366F1" : provided.boxShadow,
    "&:hover": {
      borderColor: state.isFocused ? "#6366F1" : provided.borderColor,
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Selecione...",
  error,
}) => {
  // Converte as opções para o formato do react-select: { value, label }
  const selectOptions: OptionType[] = options.map((opt) => ({
    value: opt.name, // usamos o nome como valor
    label: opt.name,
  }));

  // Encontra a opção selecionada comparando o valor (string)
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
