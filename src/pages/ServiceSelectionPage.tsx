"use client";

import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/SessionContextProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: "", whatsapp: "" });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, whatsapp")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        toast.error("Erro ao carregar seu perfil.");
      } else if (profileData) {
        setProfile(profileData);
        if (!profileData.name || !profileData.whatsapp) {
          setProfileFormData({ name: profileData.name || "", whatsapp: profileData.whatsapp || "" });
          setIsProfileModalOpen(true);
        }
      } else {
        setIsProfileModalOpen(true);
      }

      const { data: servicesData, error: servicesError } = await supabase.from("services").select("*");
      if (servicesError) {
        toast.error("Erro ao carregar os serviços: " + servicesError.message);
      } else {
        setServices(servicesData);
      }
      setLoading(false);
    };

    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const fetchAvailableEmployees = async (serviceIds: string[]) => {
      if (serviceIds.length === 0) {
        setAvailableEmployees([]);
        setSelectedEmployeeId(null);
        return;
      }
      setLoadingEmployees(true);
      const { data, error } = await supabase.rpc('get_employees_for_services', {
        p_service_ids: serviceIds,
      });

      if (error) {
        showError("Erro ao buscar funcionários disponíveis.");
        setAvailableEmployees([]);
      } else {
        setAvailableEmployees(data);
      }
      setSelectedEmployeeId(null);
      setLoadingEmployees(false);
    };

    fetchAvailableEmployees(Array.from(selectedServiceIds));
  }, [selectedServiceIds]);

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

  const handleProfileUpdate = async () => {
    if (!user) return;
    if (!profileFormData.name.trim() || !profileFormData.whatsapp.trim()) {
      showError("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ name: profileFormData.name, whatsapp: profileFormData.whatsapp })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } else {
      setProfile(data);
      setIsProfileModalOpen(false);
      showSuccess("Perfil atualizado com sucesso!");
    }
  };

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (service.description && service.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [searchTerm, services]);

  const selectedServices = services.filter((service) => selectedServiceIds.has(service.id));
  const totalAmount = selectedServices.reduce((sum, service) => sum + service.price, 0);

  const handleContinue = () => {
    if (!profile?.name || !profile.whatsapp) {
      setIsProfileModalOpen(true);
      return;
    }
    if (selectedServices.length === 0) {
      showError("Por favor, selecione pelo menos um serviço para continuar.");
      return;
    }
    if (!selectedEmployeeId) {
      showError("Por favor, selecione um funcionário para continuar.");
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
    <>
      <Dialog open={isProfileModalOpen} onOpenChange={(isOpen) => { if (!isOpen && (!profile?.name || !profile?.whatsapp)) { setIsProfileModalOpen(true) } else { setIsProfileModalOpen(isOpen) }}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete seu Perfil</DialogTitle>
            <DialogDescription>
              Precisamos do seu nome e WhatsApp para prosseguir com o agendamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={profileFormData.name} onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
              <Input id="whatsapp" value={profileFormData.whatsapp} onChange={(e) => setProfileFormData({ ...profileFormData, whatsapp: e.target.value })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleProfileUpdate}>Salvar e Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4 text-center">Selecione Seus Serviços</h1>
        
        {profile?.name && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-center">
            <p className="text-lg font-medium">Olá, {profile.name}!</p>
          </div>
        )}

        <div className="mb-6">
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md mx-auto block"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServiceIds.has(service.id)}
                onSelect={handleServiceSelect}
              />
            ))}
          </div>
        )}

        {selectedServiceIds.size > 0 && (
          <div className="my-6 max-w-md mx-auto">
            <Label htmlFor="employee-select" className="text-lg font-semibold mb-2 block text-center">Selecione o Funcionário</Label>
            {loadingEmployees ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId || undefined} disabled={availableEmployees.length === 0}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder={availableEmployees.length > 0 ? "Escolha um profissional" : "Nenhum profissional disponível"} />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
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
          <Button onClick={handleContinue} className="w-full mt-6 text-lg py-3">
            Agendar Horário
          </Button>
        </div>
        <div className="text-center mt-8">
          <Button variant="link" onClick={handleLogout} className="text-sm text-blue-500">
            Sair
          </Button>
        </div>
      </div>
    </>
  );
};

export default ServiceSelectionPage;