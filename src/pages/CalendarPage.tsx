"use client";

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const availableTimes = [
  "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"
];

function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientInfo, selectedServices } = location.state || {};

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleConfirmAppointment = () => {
    if (!date || !selectedTime) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data e um horário.",
        variant: "destructive",
      });
      return;
    }

    const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });
    
    toast({
      title: "Agendamento Confirmado!",
      description: `Cliente: ${clientInfo?.name || "N/A"}, Data: ${formattedDate}, Hora: ${selectedTime}, Serviços: ${selectedServices?.map((s: any) => s.name).join(", ") || "N/A"}`,
    });

    // Aqui você pode adicionar a lógica para salvar o agendamento no banco de dados
    // e então redirecionar para uma página de confirmação ou para a home.
    // Por enquanto, apenas exibimos o toast.
    navigate("/"); // Redireciona para a página inicial após a confirmação
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Agende seu Horário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={ptBR}
                className="rounded-md border shadow"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-4 text-center md:text-left">Horários Disponíveis</h3>
              <div className="grid grid-cols-3 gap-3">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                    className="w-full"
                  >
                    {time}
                  </Button>
                ))}
              </div>
              {date && selectedTime && (
                <p className="mt-6 text-center text-lg font-medium">
                  Você selecionou: <span className="font-bold">{format(date, "dd/MM/yyyy", { locale: ptBR })}</span> às <span className="font-bold">{selectedTime}</span>
                </p>
              )}
              <Button onClick={handleConfirmAppointment} className="w-full mt-6 text-lg py-3">
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarPage;