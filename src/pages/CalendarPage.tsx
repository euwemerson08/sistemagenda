"use client";

import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showError, showSuccess } from "@/utils/toast"; // Importar showError e showSuccess do utils/toast

interface Service {
  id: string;
  name: string;
  description: string | null;
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
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  ];

  const handleSchedule = () => {
    if (!date) {
      showError("Por favor, selecione uma data.");
      return;
    }
    if (!selectedTime) {
      showError("Por favor, selecione um horário.");
      return;
    }

    // Lógica para agendar o horário com a data selecionada, serviços e informações do cliente
    console.log("Agendamento para:", date.toLocaleDateString(), "às", selectedTime);
    console.log("Cliente:", clientName, "WhatsApp:", clientWhatsapp);
    console.log("Serviços:", selectedServices);
    console.log("Total:", totalAmount);

    showSuccess(`Agendamento para ${date.toLocaleDateString()} às ${selectedTime} confirmado!`);
    // Você pode adicionar uma navegação para uma página de confirmação aqui
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Selecione o Horário</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            <Separator className="my-4" />
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