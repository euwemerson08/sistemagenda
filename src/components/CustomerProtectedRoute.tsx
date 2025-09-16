"use client";

import React from "react";
import { useSession } from "@/components/SessionContextProvider";
import { Navigate } from "react-router-dom";

const CustomerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace />; // Redirect to customer login page
  }

  return <>{children}</>;
};

export default CustomerProtectedRoute;