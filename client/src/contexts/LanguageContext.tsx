import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Language, getTranslation, getAvailableLanguages } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
  availableLanguages: Array<{ code: Language; name: string }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get language from localStorage
    const saved = localStorage.getItem("language");
    if (saved === "ko" || saved === "en") {
      return saved;
    }
    // Default to Korean
    return "ko";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (keyPath: string) => getTranslation(language, keyPath);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages: getAvailableLanguages(),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
