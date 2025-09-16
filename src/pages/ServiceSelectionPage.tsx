"use client";

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

function ServiceSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientInfo } = location.state || {};

  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices((prevSelected) =>
      prevSelected.some((s) => s.id === service.id)
        ? prevSelected.filter((s) => s.id !== service.id)
        : [...prevSelected, service]
    );
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "Nenhum serviço selecionado",
        description: "Por favor, selecione pelo menos um serviço para continuar.",
        variant: "destructive",
      });
      return;
    }
    navigate("/calendar", { state: { clientInfo, selectedServices } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Carregando serviços...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Erro ao carregar serviços: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Selecione os Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center text-gray-600">
            Olá, {clientInfo?.name || "cliente"}! Por favor, escolha os serviços desejados.
          </p>
          <div className="space-y-4">
            {services?.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={selectedServices.some((s) => s.id === service.id)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <label
                    htmlFor={`service-${service.id}`}
                    className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {service.name}
                  </label>
                </div>
                <span className="text-lg font-semibold text-blue-600">
                  R$ {service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <Button onClick={handleContinue} className="w-full mt-6 text-lg py-3">
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ServiceSelectionPage;