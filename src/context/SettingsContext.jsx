import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    theme: "system",
    language: "en",
    unit: "kwh",
    currency: "INR",
    defaultCost: 60000,
  });

  // APPLY THEME GLOBALLY
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (theme) => {
      root.setAttribute("data-theme", theme);
    };

    if (settings.theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(isDark ? "dark" : "light");
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  return <SettingsContext.Provider value={{ settings, setSettings }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
