"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceSelectionPage from "./pages/ServiceSelectionPage";
import CalendarPage from "./pages/CalendarPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ServicesManagementPage from "./pages/admin/ServicesManagementPage";
import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<ServiceSelectionPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="services" element={<ServicesManagementPage />} />
          {/* Adicione mais rotas de administração aqui */}
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;