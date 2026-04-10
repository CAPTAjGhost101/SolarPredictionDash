import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { Palette, Bolt, NotebookPen } from "lucide-react";
export default function Settings() {
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
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {/* APPEARANCE */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex gap-2 items-center">
          <Palette /> <div>Appearance</div>
        </h2>

        <select
          value={settings.theme}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              theme: e.target.value,
            }))
          }
        >
          <option value="system">System Default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* PREFERENCES */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex gap-2 items-center">
          <Bolt /> <div>Preferences</div>
        </h2>

        {/* Language */}
        <div>
          <label className="text-sm text-[var(--text-muted)]">Language</label>
          <select
            value={settings.language}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                language: e.target.value,
              }))
            }
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        {/* Unit */}
        <div>
          <label className="text-sm text-[var(--text-muted)]">Energy Unit</label>
          <select
            value={settings.unit}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                unit: e.target.value,
              }))
            }
          >
            <option value="kwh">kWh</option>
            <option value="units">Units</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="text-sm text-[var(--text-muted)]">Currency</label>
          <select
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
          <NotebookPen /> <div>Defaults</div>
        </h2>

        <div>
          <label className="text-sm text-[var(--text-muted)]">Default Cost per kW ({settings.currency === "INR" ? "₹" : "$"})</label>

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

          <p className="text-xs text-[var(--text-muted)] mt-1">Used for auto-calculation in dashboard</p>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-600">⚠️ Danger Zone</h2>

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
          Reset Settings
        </button>
      </div>
    </div>
  );
}
