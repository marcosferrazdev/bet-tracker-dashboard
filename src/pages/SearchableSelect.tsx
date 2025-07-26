import React from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { useTheme } from "@/components/ui/theme-provider";

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
  onMenuOpenChange?: (isOpen: boolean) => void;
}

interface OptionType {
  value: string;
  label: string;
}

const getCustomStyles = (hasError: boolean, isDark: boolean): StylesConfig<OptionType, false> => {
  const colors = {
    background: isDark ? "#0a0a0a" : "#fafafa",
    foreground: isDark ? "#fafafa" : "#09090b",
    border: isDark ? "#262626" : "#e4e4e7",
    input: isDark ? "#262626" : "#e4e4e7",
    ring: isDark ? "#3b82f6" : "#2563eb",
    muted: isDark ? "#262626" : "#f4f4f5",
    mutedForeground: isDark ? "#a1a1aa" : "#71717a",
    accent: isDark ? "#262626" : "#f4f4f5",
    accentForeground: isDark ? "#fafafa" : "#09090b",
    destructive: isDark ? "#dc2626" : "#ef4444",
    popover: isDark ? "#0a0a0a" : "#ffffff",
    popoverForeground: isDark ? "#fafafa" : "#09090b",
    primary: isDark ? "#3b82f6" : "#2563eb",
    primaryForeground: isDark ? "#1e293b" : "#f8fafc",
  };

  return {
    control: (provided, state) => ({
      ...provided,
      minHeight: "2.5rem",
      border: `1px solid ${hasError ? colors.destructive : state.isFocused ? colors.ring : colors.input}`,
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      backgroundColor: colors.background,
      color: colors.foreground,
      boxShadow: hasError
        ? `0 0 0 2px ${colors.destructive}20`
        : state.isFocused
        ? `0 0 0 2px ${colors.ring}20`
        : "none",
      "&:hover": {
        borderColor: hasError ? colors.destructive : state.isFocused ? colors.ring : colors.input,
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: colors.foreground,
    }),
    input: (provided) => ({
      ...provided,
      color: colors.foreground,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: colors.mutedForeground,
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      color: colors.mutedForeground,
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: colors.mutedForeground,
      "&:hover": {
        color: colors.foreground,
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.375rem",
      marginTop: "0.25rem",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      zIndex: 9999,
      backgroundColor: colors.popover,
      border: `1px solid ${colors.border}`,
      position: "fixed",
      width: "var(--radix-select-trigger-width, auto)",
      maxWidth: "calc(100vw - 2rem)",
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: colors.popover,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? colors.accent : "transparent",
      color: state.isFocused ? colors.accentForeground : colors.popoverForeground,
      padding: "0.5rem 1rem",
      fontSize: "0.75rem",
      cursor: "pointer",
      "&:active": {
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
      },
    }),
  };
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Selecione...",
  error,
  onMenuOpenChange,
}) => {
  const { theme } = useTheme();
  
  // Detecta se está no tema dark
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
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
    <div className={error ? "react-select-error" : ""}>
      <Select<OptionType, false>
        value={selectedOption}
        onChange={handleChange}
        options={selectOptions}
        placeholder={placeholder}
        styles={getCustomStyles(!!error, isDark)}
        isSearchable
        classNamePrefix="react-select"
        menuPosition="fixed"
        menuPlacement="auto"
        maxMenuHeight={200}
        onMenuOpen={() => onMenuOpenChange?.(true)}
        onMenuClose={() => onMenuOpenChange?.(false)}
      />
      {error && <p className="text-danger text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
