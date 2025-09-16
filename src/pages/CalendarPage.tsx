"use client";

import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

const CalendarPage: React.FC = () => {
  const location = useLocation();
  const { clientName, clientWhatsapp, selectedServices, totalAmount } = (location.state || {}) as {
    clientName?: string;
    clientWhatsapp?: string;
    selectedServices?: Service[];
    totalAmount?: number;
  };

  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleSchedule = () => {
    if (!date) {
      // Aqui você pode adicionar um toast de erro se nenhuma data for selecionada
      console.error("Por favor, selecione uma data.");
      return;
    }
    // Lógica para agendar o horário com a data selecionada, serviços e informações do cliente
    console.log("Agendamento para:", date);
    console.log("Cliente:", clientName, "WhatsApp:", clientWhatsapp);
    console.log("Serviços:", selectedServices);
    console.log("Total:", totalAmount);
    // Exibir uma mensagem de sucesso ou navegar para uma página de confirmação
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Agende Seu Horário</h1>

      {clientName && clientWhatsapp && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-center">
          <p className="text-lg font-medium">Olá, {clientName}!</p>
          <p className="text-sm text-muted-foreground">Seu WhatsApp: {clientWhatsapp}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold mb-4">Selecione a Data</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow"
            />
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold mb-4">Detalhes do Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedServices && selectedServices.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {selectedServices.map((service) => (
                  <li key={service.id} className="flex justify-between items-center">
                    <span className="text-lg">{service.name}</span>
                    <span className="font-medium">R$ {service.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mb-4">Nenhum serviço selecionado.</p>
            )}
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-xl font-bold text-primary">R$ {totalAmount?.toFixed(2) || "0.00"}</span>
            </div>
            <Button onClick={handleSchedule} className="w-full mt-6 text-lg py-3">
              Confirmar Agendamento
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
        <Link to="/services" className="text-sm text-blue-500 hover:underline">
          Voltar para seleção de serviços
        </Link>
      </div>
    </div>
  );
};

export default CalendarPage;