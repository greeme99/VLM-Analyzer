import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeType = "light" | "dark" | "gray-blue";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  availableThemes: ThemeType[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const AVAILABLE_THEMES: ThemeType[] = ["light", "dark", "gray-blue"];

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "gray-blue") {
        return saved;
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Update document class
    const root = document.documentElement;
    AVAILABLE_THEMES.forEach(t => root.classList.remove(t));
    root.classList.add(theme);

    // Update CSS variables based on theme
    updateThemeVariables(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const currentIndex = AVAILABLE_THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
    setTheme(AVAILABLE_THEMES[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, availableThemes: AVAILABLE_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Update CSS variables based on selected theme
 */
function updateThemeVariables(theme: ThemeType) {
  const root = document.documentElement;
  const colors = getThemeColors(theme);

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}

/**
 * Get theme color palette
 */
function getThemeColors(theme: ThemeType): Record<string, string> {
  const themes: Record<ThemeType, Record<string, string>> = {
    light: {
      background: "#ffffff",
      foreground: "#0a0a0a",
      card: "#f5f5f5",
      "card-foreground": "#0a0a0a",
      primary: "#007bff",
      "primary-foreground": "#ffffff",
      secondary: "#6c757d",
      "secondary-foreground": "#ffffff",
      muted: "#e9ecef",
      "muted-foreground": "#6c757d",
      accent: "#28a745",
      "accent-foreground": "#ffffff",
      destructive: "#dc3545",
      "destructive-foreground": "#ffffff",
      border: "#dee2e6",
      input: "#ffffff",
      ring: "#007bff",
    },
    dark: {
      background: "#0a0a0a",
      foreground: "#fafafa",
      card: "#1a1a1a",
      "card-foreground": "#fafafa",
      primary: "#3b82f6",
      "primary-foreground": "#0a0a0a",
      secondary: "#6b7280",
      "secondary-foreground": "#fafafa",
      muted: "#27272a",
      "muted-foreground": "#a1a1aa",
      accent: "#10b981",
      "accent-foreground": "#0a0a0a",
      destructive: "#ef4444",
      "destructive-foreground": "#fafafa",
      border: "#27272a",
      input: "#1a1a1a",
      ring: "#3b82f6",
    },
    "gray-blue": {
      background: "#1a1f2e",
      foreground: "#e8eef7",
      card: "#242d3d",
      "card-foreground": "#e8eef7",
      primary: "#4a90e2",
      "primary-foreground": "#1a1f2e",
      secondary: "#7b8fa3",
      "secondary-foreground": "#e8eef7",
      muted: "#3a4556",
      "muted-foreground": "#8b9ab8",
      accent: "#50c878",
      "accent-foreground": "#1a1f2e",
      destructive: "#ff6b6b",
      "destructive-foreground": "#e8eef7",
      border: "#3a4556",
      input: "#2a3547",
      ring: "#4a90e2",
    },
  };

  return themes[theme];
}

/**
 * Get theme display name
 */
export function getThemeDisplayName(theme: ThemeType): string {
  const names: Record<ThemeType, string> = {
    light: "라이트",
    dark: "다크",
    "gray-blue": "그레이 + 블루",
  };
  return names[theme];
}
