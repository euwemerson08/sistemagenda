"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceSelectionPage from "./pages/ServiceSelectionPage";
import CalendarPage from "./pages/CalendarPage";
import AdminPanelPage from "./pages/AdminPanelPage"; // Importar a nova página
import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<ServiceSelectionPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/admin" element={<AdminPanelPage />} /> {/* Nova rota para o painel de admin */}
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;