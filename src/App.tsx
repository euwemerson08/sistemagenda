"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceSelectionPage from "./pages/ServiceSelectionPage"; // Importar a página de seleção de serviços
import { Toaster } from "@/components/ui/toaster"; // Importar o Toaster para exibir as mensagens de toast

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<ServiceSelectionPage />} /> {/* Nova rota para seleção de serviços */}
      </Routes>
      <Toaster /> {/* Adicionar o Toaster aqui para que as mensagens apareçam */}
    </Router>
  );
}

export default App;