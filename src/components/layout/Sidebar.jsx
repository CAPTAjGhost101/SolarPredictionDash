import { LayoutDashboard, Sun, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
export default function Sidebar() {
  return (
    <div
      className="
        w-64 h-screen
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
          <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarItem to="/help" icon={<Sun size={18} />} label="Help Desk" />
          <SidebarItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>
      </div>

      {/* Bottom */}
      <div className="text-xs text-[var(--text-muted)]">Solar Planner v1.0</div>
    </div>
  );
}

function SidebarItem({ icon, label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-200
        ${isActive ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-[var(--border)] hover:pl-4"}
      `}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </NavLink>
  );
}
