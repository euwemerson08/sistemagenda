"use client";

import React, { useState } from "react";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

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
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

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
    toast({
      title: "Serviços selecionados!",
      description: `Você selecionou ${selectedServices.length} serviço(s) com um total de R$ ${totalAmount.toFixed(2)}.`,
    });
    console.log("Serviços selecionados:", selectedServices);
    // Aqui você pode adicionar a lógica para prosseguir, como navegar para uma página de agendamento
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Selecione Seus Serviços</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {mockServices.map((service) => (
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
          Continuar
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