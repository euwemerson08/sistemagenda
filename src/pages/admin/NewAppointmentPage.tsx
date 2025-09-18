"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AppointmentFormDialog } from "@/components/admin/AppointmentFormDialog";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number | null;
}

interface Employee {
  id: string;
  name: string;
}

export default function NewAppointmentPage() {
  const navigate = useNavigate();
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: servicesData, error: servicesError } = await supabase.from("services").select("*");
      if (servicesError) toast.error("Erro ao carregar serviços.");
      else setAllServices(servicesData || []);

      const { data: employeesData, error: employeesError } = await supabase.from("employees").select("id, name");
      if (employeesError) toast.error("Erro ao carregar funcionários.");
      else setAllEmployees(employeesData || []);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAppointmentSave = () => {
    navigate("/admin/appointments");
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando dados para o formulário...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Novo Agendamento</h1>
      <AppointmentFormDialog
        isOpen={true} // Sempre aberto para a página de criação
        onClose={() => navigate("/admin/appointments")} // Redireciona ao fechar
        initialData={null}
        allServices={allServices}
        allEmployees={allEmployees}
        onSave={handleAppointmentSave}
      />
    </div>
  );
}