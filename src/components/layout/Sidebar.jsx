import { LayoutDashboard, Sun, Settings, Home, HelpCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslate } from "../../utils/useTranslate";
export default function Sidebar() {
  const { t } = useTranslate();
  return (
    <div
      className="
        w-64 h-full md:h-screen
        bg-[var(--card)]
        border-r border-[var(--border)]
        p-4
        flex flex-col
        justify-between
      "
    >
      {/* Logo */}
      <div>
        <h1 className="text-xl font-semibold mb-8 tracking-tight">
          SolarPlanner <span className="text-xs text-gray-500">v2.1</span>
        </h1>

        {/* Menu */}
        <nav className="space-y-1">
          <SidebarItem to="/" icon={<Home size={18} />} label={t("home")} />

          <SidebarItem to="/dashboard" icon={<LayoutDashboard size={18} />} label={t("dashboard")} />

          <SidebarItem to="/help" icon={<HelpCircle size={18} />} label={t("help")} />

          <SidebarItem to="/settings" icon={<Settings size={18} />} label={t("settings")} />
        </nav>
      </div>

      {/* Bottom */}
      <div className="text-xs text-[var(--text-muted)]">Solar Planner v2.1</div>
    </div>
  );
}

function SidebarItem({ icon, label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        group
        relative flex items-center gap-3 px-3 py-2.5 rounded-xl
        cursor-pointer overflow-hidden
        transition-all duration-300

        ${isActive ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"}
      `}
    >
      {/* Glow Hover Effect */}
      <div
        className="
        absolute inset-0 opacity-0 group-hover:opacity-100
        bg-[var(--primary)]/10
        blur-xl transition duration-300
      "
      />

      {/* Icon */}
      <span className="relative z-10 group-hover:scale-110 transition-transform">{icon}</span>

      {/* Label */}
      <span className="relative z-10 text-sm font-medium">{label}</span>
    </NavLink>
  );
}
