"use client";

import React, { useState, useMemo } from "react";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Importar useNavigate
import { Input } from "@/components/ui/input";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

const mockServices: Service[] = [
  { id: "1", name: "Corte de Cabelo", description: "Corte moderno e estilizado.", price: 50.00 },
  { id: "2", name: "Barba", description: "Modelagem e aparo de barba com toalha quente.", price: 30.00 },
  { id: "3", name: "Corte + Barba", description: "Combo completo de corte e barba.", price: 75.00 },
  { id: "4", name: "Hidratação Capilar", description: "Tratamento para cabelos ressecados.", price: 40.00 },
  { id: "5", name: "Coloração", description: "Coloração profissional para o cabelo.", price: 120.00 },
  { id: "6", name: "Massagem Relaxante", description: "Sessão de massagem para aliviar o estresse.", price: 90.00 },
];

const ServiceSelectionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Inicializar useNavigate
  const { clientName, clientWhatsapp } = (location.state || {}) as { clientName?: string; clientWhatsapp?: string };

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>("");

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
    if (!searchTerm) {
      return mockServices;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return mockServices.filter(
      (service) =>
        service.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        service.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm]);

  const selectedServices = mockServices.filter((service) =>
    selectedServiceIds.has(service.id)
  );

  const totalAmount = selectedServices.reduce((sum, service) => sum + service.price, 0);

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "Nenhum serviço selecionado",
        description: "Por favor, selecione pelo menos um serviço para continuar.",
        variant: "destructive",
      });
      return;
    }
    // Navegar para a página do calendário, passando os dados
    navigate("/calendar", {
      state: { clientName, clientWhatsapp, selectedServices, totalAmount },
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Selecione Seus Serviços</h1>
      
      {clientName && clientWhatsapp && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-center">
          <p className="text-lg font-medium">Olá, {clientName}!</p>
          <p className="text-sm text-muted-foreground">Seu WhatsApp: {clientWhatsapp}</p>
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
        <Link to="/" className="text-sm text-blue-500 hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
};

export default ServiceSelectionPage;