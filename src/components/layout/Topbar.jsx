import ThemeToggle from "../ui/ThemeToggle";

export default function Topbar() {
  return (
    <div
      className="
        h-16
        border-b border-[var(--border)]
        flex items-center justify-between
        px-6
        bg-[var(--bg)]
      "
    >
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
