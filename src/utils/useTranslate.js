import { useSettings } from "../context/SettingsContext";
import { translations } from "./translations";

export function useTranslate() {
  const { settings } = useSettings();

  const t = (key) => {
    return translations[settings.language]?.[key] || key;
  };

  return { t };
}
