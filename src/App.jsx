import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./pages/Dashboard";
import HelpDesk from "./pages/HelpDesk";
import Settings from "./pages/Settings";

import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/help" element={<HelpDesk />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
