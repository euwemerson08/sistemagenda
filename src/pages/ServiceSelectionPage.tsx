"use client";

import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ServiceCard from "@/components/ServiceCard";
import EmployeeCard from "@/components/EmployeeCard";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/SessionContextProvider";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
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
  const [allServices, setAllServices] = useState<Service[]>([]); // Todos os serviços no sistema
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]); // Funcionários que oferecem os serviços selecionados
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false); // Novo estado de carregamento para funcionários
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Carregar perfil do usuário e todos os serviços inicialmente
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

      const { data: servicesData, error: servicesError } = await supabase.from("services").select("*");
      if (servicesError) {
        toast.error("Erro ao carregar os serviços: " + servicesError.message);
      } else {
        setAllServices(servicesData);
      }
      setLoadingInitialData(false);
    };

    fetchInitialData();
  }, [user]);

  // Buscar funcionários elegíveis quando os serviços selecionados mudam
  useEffect(() => {
    const fetchEligibleEmployees = async () => {
      if (selectedServiceIds.size === 0) {
        setEligibleEmployees([]);
        setSelectedEmployeeId(null); // Resetar funcionário selecionado se nenhum serviço for escolhido
        return;
      }

      setLoadingEmployees(true);
      setSelectedEmployeeId(null); // Resetar funcionário selecionado quando os serviços mudam

      const serviceIdsArray = Array.from(selectedServiceIds);
      const { data, error } = await supabase.rpc('get_employees_for_services', {
        p_service_ids: serviceIdsArray,
      });

      if (error) {
        toast.error("Erro ao carregar funcionários elegíveis: " + error.message);
        setEligibleEmployees([]);
      } else {
        setEligibleEmployees(data || []);
      }
      setLoadingEmployees(false);
    };

    fetchEligibleEmployees();
  }, [selectedServiceIds]); // Disparar quando selectedServiceIds muda

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

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const filteredServices = useMemo(() => {
    if (!searchTerm) return allServices; // Filtrar de todos os serviços agora
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allServices.filter(
      (service) =>
        service.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (service.description && service.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [searchTerm, allServices]);

  const selectedServicesDetails = useMemo(() => {
    return allServices.filter((service) => selectedServiceIds.has(service.id));
  }, [selectedServiceIds, allServices]);

  const totalAmount = selectedServicesDetails.reduce((sum, service) => sum + service.price, 0);

  const handleContinue = () => {
    if (selectedServiceIds.size === 0) {
      showError("Por favor, selecione pelo menos um serviço para continuar.");
      return;
    }
    if (!selectedEmployeeId) {
      showError("Por favor, selecione um funcionário para continuar.");
      return;
    }
    if (!profile?.name || !profile.whatsapp) {
      showError("Não foi possível carregar os dados do seu perfil. Tente novamente.");
      return;
    }
    navigate("/calendar", {
      state: { clientName: profile.name, clientWhatsapp: profile.whatsapp, selectedServices: selectedServicesDetails, totalAmount, selectedEmployeeId },
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
      <h1 className="text-3xl font-bold mb-4 text-center">Selecione os Serviços e o Profissional</h1>

      {profile?.name && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-center">
          <p className="text-lg font-medium">Olá, {profile.name}!</p>
        </div>
      )}

      <div className="my-6">
        <Label className="text-lg font-semibold mb-4 block text-center">Selecione os Serviços</Label>
        <div className="mb-6">
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md mx-auto block"
          />
        </div>
        {loadingInitialData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {filteredServices.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">Nenhum serviço disponível.</p>
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
      </div>

      <Separator className="my-8" />

      <div className="my-6">
        <Label className="text-lg font-semibold mb-4 block text-center">Selecione o Profissional</Label>
        {selectedServiceIds.size === 0 ? (
          <p className="text-center text-muted-foreground">Selecione um ou mais serviços para ver os profissionais disponíveis.</p>
        ) : loadingEmployees ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibleEmployees.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">Nenhum profissional encontrado para os serviços selecionados.</p>
            ) : (
              eligibleEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  isSelected={selectedEmployeeId === employee.id}
                  onSelect={handleEmployeeSelect}
                />
              ))
            )}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {selectedServicesDetails.length > 0 && (
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Resumo da Seleção</h2>
          <ul className="space-y-2 mb-4">
            {selectedServicesDetails.map((service) => (
              <li key={service.id} className="flex justify-between items-center">
                <span className="text-lg">{service.name}</span>
                <span className="font-medium">R$ {service.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center border-t pt-4 mt-4">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-xl font-bold text-primary">R$ {totalAmount.toFixed(2)}</span>
          </div>
          <Button onClick={handleContinue} className="w-full mt-6 text-lg py-3" disabled={selectedServiceIds.size === 0 || !selectedEmployeeId}>
            Agendar Horário
          </Button>
        </div>
      )}
      <div className="text-center mt-8">
        <Button variant="link" onClick={handleLogout} className="text-sm text-blue-500">
          Sair
        </Button>
      </div>
    </div>
  );
};

export default ServiceSelectionPage;