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
    borderColor: state.isFocused ? "#6366F1" : "#d1d5db", // azul se focado, cinza (#d1d5db) se não
    boxShadow: state.isFocused ? "0 0 0 1px #6366F1" : "none",
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm
    backgroundColor: "white",
    color: "#374151", // gray-700
    "&:hover": {
      borderColor: state.isFocused ? "#6366F1" : "#d1d5db", // mantém cinza se não focado
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#374151",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#6b7280", // gray-500
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.375rem",
    marginTop: "0.25rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#e5e7eb" : "white",
    color: state.isFocused ? "#111827" : "#374151",
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
