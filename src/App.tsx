"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ServiceSelectionPage from "./pages/ServiceSelectionPage";
import CalendarPage from "./pages/CalendarPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ServicesManagementPage from "./pages/admin/ServicesManagementPage";
import OperatingHoursManagementPage from "./pages/admin/OperatingHoursManagementPage";
import AppointmentsPage from "./pages/admin/AppointmentsPage";
import EmployeesManagementPage from "./pages/admin/EmployeesManagementPage";
import NewAppointmentPage from "./pages/admin/NewAppointmentPage";
import StoreSettingsPage from "./pages/admin/StoreSettingsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import Login from "./pages/Login";
import { SessionContextProvider, useSession } from "./components/SessionContextProvider";
import { Toaster } from "sonner";
import React from "react";
import CustomerProtectedRoute from "./components/CustomerProtectedRoute";

// Componente de rota protegida para Admin
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />; // Redirect to admin login
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router basename="/vite_react_shadcn_ts"> {/* Adicionado basename para GitHub Pages */}
      <SessionContextProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* Customer Protected Routes */}
          <Route path="/services" element={<CustomerProtectedRoute><ServiceSelectionPage /></CustomerProtectedRoute>} />
          <Route path="/calendar" element={<CustomerProtectedRoute><CalendarPage /></CustomerProtectedRoute>} />
          {/* Rotas de pagamento removidas */}

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="services" element={<ServicesManagementPage />} />
            <Route path="operating-hours" element={<OperatingHoursManagementPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="employees" element={<EmployeesManagementPage />} />
            <Route path="new-appointment" element={<NewAppointmentPage />} />
            <Route path="store-settings" element={<StoreSettingsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
        <Toaster />
      </SessionContextProvider>
    </Router>
  );
}

export default App;