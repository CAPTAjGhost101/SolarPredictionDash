import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { Palette, Bolt, NotebookPen } from "lucide-react";
import { useTranslate } from "../utils/useTranslate";
export default function Settings() {
  const { t } = useTranslate();
  const { settings, setSettings } = useSettings();

  // SAVE to localStorage
  useEffect(() => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
  }, [settings]);

  // LOAD from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("app_settings");

    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("settings")}</h1>

      {/* APPEARANCE */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex gap-2 items-center">
          <Palette /> <div>{t("appearance")}</div>
        </h2>

        <select
          className="
    mt-1 w-full px-3 py-2 rounded-lg
    bg-[var(--card)] text-[var(--text)]
    border border-[var(--border)]
    focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  "
          value={settings.theme}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              theme: e.target.value,
            }))
          }
        >
          <option value="system">{t("systemDefault")}</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* PREFERENCES */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex gap-2 items-center">
          <Bolt /> <div>{t("preferences")}</div>
        </h2>

        {/* Language */}
        <div>
          <label className="text-sm text-[var(--text-muted)]">{t("language")}</label>
          <select
            className="
    mt-1 w-full px-3 py-2 rounded-lg
    bg-[var(--card)] text-[var(--text)]
    border border-[var(--border)]
    focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  "
            value={settings.language}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                language: e.target.value,
              }))
            }
          >
            <option value="en">{t("english")}</option>
            <option value="hi">{t("hindi")}</option>
          </select>
        </div>

        {/* Unit */}
        <div>
          <label className="text-sm text-[var(--text-muted)]">{t("energyUnit")}</label>
          <select
            className="
    mt-1 w-full px-3 py-2 rounded-lg
    bg-[var(--card)] text-[var(--text)]
    border border-[var(--border)]
    focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  "
            value={settings.unit}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                unit: e.target.value,
              }))
            }
          >
            <option value="kwh">kWh</option>
            <option value="units">{t("units")}</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="text-sm text-[var(--text-muted)]">{t("currency")}</label>
          <select
            className="
    mt-1 w-full px-3 py-2 rounded-lg
    bg-[var(--card)] text-[var(--text)]
    border border-[var(--border)]
    focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  "
            value={settings.currency}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                currency: e.target.value,
              }))
            }
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
          </select>
        </div>
      </div>

      {/* DEFAULTS */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex gap-2 items-center">
          <NotebookPen /> <div>{t("defRate")}</div>
        </h2>

        <div>
          <label className="text-sm text-[var(--text-muted)]">
            {t("defCost")}({settings.currency === "INR" ? "₹" : "$"})
          </label>

          <input
            type="number"
            value={settings.defaultCost}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                defaultCost: Number(e.target.value),
              }))
            }
            className="input mt-1"
          />

          <p className="text-xs text-[var(--text-muted)] mt-1">{t("usedNote")}</p>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div
        className="bg-red-50 dark:bg-red-900/20
  border border-red-200 dark:border-red-800
  rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">{t("danger")}</h2>

        <button
          onClick={() => {
            const defaultSettings = {
              theme: "system",
              language: "en",
              unit: "kwh",
              currency: "INR",
              defaultCost: 60000,
            };

            setSettings(defaultSettings);
            localStorage.removeItem("app_settings");
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:opacity-90 active:scale-[0.97] active:shadow-inner transition-all"
        >
          {t("resetSetting")}
        </button>
      </div>
      <div className="flex justify-center items-center text-xs text-gray-600 mt-6">
        <span className="mr-1 gradient-text">Made by</span>
        <span className="font-medium text-gray-400 tracking-wide gradient-text">Ajay Danu</span>
      </div>
    </div>
  );
}
