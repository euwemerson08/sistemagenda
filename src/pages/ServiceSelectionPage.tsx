"use client";

import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/SessionContextProvider";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null; // Adicionado duration para cálculo de duração total
}

interface Employee {
  id: string;
  name: string;
}

interface Profile {
  name: string | null;
  whatsapp: string | null;
}

const ServiceSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [servicesForSelectedEmployee, setServicesForSelectedEmployee] = useState<Service[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch initial data: user profile and all employees
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      setLoadingInitialData(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, whatsapp")
        .eq("id", user.id)
        .single();

      if (profileError) {
        toast.error("Erro ao carregar seu perfil.");
      } else {
        setProfile(profileData);
      }

      const { data: employeesData, error: employeesError } = await supabase.from("employees").select("id, name");
      if (employeesError) {
        toast.error("Erro ao carregar os funcionários: " + employeesError.message);
      } else {
        setAllEmployees(employeesData);
      }
      setLoadingInitialData(false);
    };

    fetchInitialData();
  }, [user]);

  // Fetch services for the selected employee
  useEffect(() => {
    const fetchServicesForEmployee = async () => {
      if (!selectedEmployeeId) {
        setServicesForSelectedEmployee([]);
        setSelectedServiceIds(new Set()); // Reset selected services when no employee is chosen
        return;
      }

      setLoadingServices(true);
      setSelectedServiceIds(new Set()); // Reset selected services when employee changes

      const { data, error } = await supabase
        .from("employee_services")
        .select("service_id, services(*)") // Select service_id and all columns from the joined services table
        .eq("employee_id", selectedEmployeeId);

      if (error) {
        toast.error("Erro ao carregar serviços para o funcionário: " + error.message);
        setServicesForSelectedEmployee([]);
      } else {
        // Extract the service objects from the nested structure
        const employeeServices = data.map(item => item.services).filter(Boolean) as Service[];
        setServicesForSelectedEmployee(employeeServices);
      }
      setLoadingServices(false);
    };

    fetchServicesForEmployee();
  }, [selectedEmployeeId]); // Trigger when selectedEmployeeId changes

  const handleServiceSelect = (serviceId: string, isSelected: boolean) => {
    setSelectedServiceIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (isSelected) {
        newSelected.add(serviceId);
      } else {
        newSelected.delete(serviceId);
      }
      return newSelected;
    });
  };

  const filteredServices = useMemo(() => {
    if (!searchTerm) return servicesForSelectedEmployee;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return servicesForSelectedEmployee.filter(
      (service) =>
        service.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (service.description && service.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [searchTerm, servicesForSelectedEmployee]);

  const selectedServices = servicesForSelectedEmployee.filter((service) => selectedServiceIds.has(service.id));
  const totalAmount = selectedServices.reduce((sum, service) => sum + service.price, 0);

  const handleContinue = () => {
    if (!selectedEmployeeId) {
      showError("Por favor, selecione um funcionário para continuar.");
      return;
    }
    if (selectedServices.length === 0) {
      showError("Por favor, selecione pelo menos um serviço para continuar.");
      return;
    }
    if (!profile?.name || !profile.whatsapp) {
      showError("Não foi possível carregar os dados do seu perfil. Tente novamente.");
      return;
    }
    navigate("/calendar", {
      state: { clientName: profile.name, clientWhatsapp: profile.whatsapp, selectedServices, totalAmount, selectedEmployeeId },
    });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout: " + error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Selecione o Profissional e os Serviços</h1>
      
      {profile?.name && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-center">
          <p className="text-lg font-medium">Olá, {profile.name}!</p>
        </div>
      )}

      <div className="my-6 max-w-md mx-auto">
        <Label htmlFor="employee-select" className="text-lg font-semibold mb-2 block text-center">Selecione o Profissional</Label>
        {loadingInitialData ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId || undefined}>
            <SelectTrigger id="employee-select">
              <SelectValue placeholder={allEmployees.length > 0 ? "Escolha um profissional" : "Nenhum profissional disponível"} />
            </SelectTrigger>
            <SelectContent>
              {allEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator className="my-8" />

      {selectedEmployeeId && (
        <>
          <div className="mb-6">
            <Input
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md mx-auto block"
            />
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {filteredServices.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">Nenhum serviço disponível para este profissional.</p>
              ) : (
                filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedServiceIds.has(service.id)}
                    onSelect={handleServiceSelect}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      <Separator className="my-8" />

      <div className="bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Resumo da Seleção</h2>
        {selectedServices.length === 0 ? (
          <p className="text-muted-foreground">Nenhum serviço selecionado.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {selectedServices.map((service) => (
              <li key={service.id} className="flex justify-between items-center">
                <span className="text-lg">{service.name}</span>
                <span className="font-medium">R$ {service.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between items-center border-t pt-4 mt-4">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-xl font-bold text-primary">R$ {totalAmount.toFixed(2)}</span>
        </div>
        <Button onClick={handleContinue} className="w-full mt-6 text-lg py-3" disabled={!selectedEmployeeId || selectedServices.length === 0}>
          Agendar Horário
        </Button>
      </div>
      <div className="text-center mt-8">
        <Button variant="link" onClick={handleLogout} className="text-sm text-blue-500">
          Sair
        </Button>
      </div>
    </div>
  );
};

export default ServiceSelectionPage;