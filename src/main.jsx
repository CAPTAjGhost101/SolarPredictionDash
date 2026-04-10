import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext.jsx";

createRoot(document.getElementById("root")).render(
  <SettingsProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </SettingsProvider>,
);
