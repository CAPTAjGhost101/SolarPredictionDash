import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./pages/Dashboard";
import HelpDesk from "./pages/HelpDesk";
import Home from "./pages/Home";
import Settings from "./pages/Settings";

import { Routes, Route } from "react-router-dom";

import { useState } from "react";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <div
        className={`
    fixed md:static top-0 left-0 z-50
    w-64 h-full
    transform transition-transform duration-300 ease-in-out shadow-xl
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
      >
        <Sidebar />
      </div>

      {/* OVERLAY */}
      <div
        className={`
    fixed inset-0 bg-black/30 z-40 md:hidden
    transition-opacity duration-300
    ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
  `}
        onClick={() => setSidebarOpen(false)}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/help" element={<HelpDesk />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
