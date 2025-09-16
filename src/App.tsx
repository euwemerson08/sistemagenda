"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceSelectionPage from "./pages/ServiceSelectionPage";
import CalendarPage from "./pages/CalendarPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ServicesManagementPage from "./pages/admin/ServicesManagementPage";
import OperatingHoursManagementPage from "./pages/admin/OperatingHoursManagementPage";
import AppointmentsPage from "./pages/admin/AppointmentsPage"; // Importar a nova página
import Login from "./pages/Login";
import { SessionContextProvider, useSession } from "./components/SessionContextProvider";
import { Toaster } from "sonner";
import React from "react";

// Componente de rota protegida
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Login />; // Redireciona para a página de login se não houver sessão
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <SessionContextProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<ServiceSelectionPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="services" element={<ServicesManagementPage />} />
            <Route path="operating-hours" element={<OperatingHoursManagementPage />} />
            <Route path="appointments" element={<AppointmentsPage />} /> {/* Adicionar a nova rota */}
          </Route>
        </Routes>
        <Toaster />
      </SessionContextProvider>
    </Router>
  );
}

export default App;