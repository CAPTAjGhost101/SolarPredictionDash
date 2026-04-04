import useTheme from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        border border-[var(--border)]
        px-3 py-1.5
        rounded-lg
        text-sm
      "
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
