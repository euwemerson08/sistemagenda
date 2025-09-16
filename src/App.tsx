"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceSelectionPage from "./pages/ServiceSelectionPage";
import CalendarPage from "./pages/CalendarPage";
import { Toaster } from "sonner"; // Importar Toaster do sonner

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<ServiceSelectionPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
      <Toaster /> {/* Usar o Toaster do sonner */}
    </Router>
  );
}

export default App;