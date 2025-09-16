"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceSelectionPage from "./pages/ServiceSelectionPage";
import CalendarPage from "./pages/CalendarPage"; // Importar a página de calendário
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<ServiceSelectionPage />} />
        <Route path="/calendar" element={<CalendarPage />} /> {/* Nova rota para o calendário */}
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;