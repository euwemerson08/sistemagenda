"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

const CalendarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientName, clientWhatsapp, selectedServices, totalAmount } = (location.state || {}) as {
    clientName?: string;
    clientWhatsapp?: string;
    selectedServices?: Service[];
    totalAmount?: number;
  };

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      if (!selectedServices || selectedServices.length === 0) {
        setAvailableEmployees([]);
        setIsLoadingEmployees(false);
        return;
      }

      setIsLoadingEmployees(true);
      const selectedServiceIds = selectedServices.map(s => s.id);

      const { data, error } = await supabase.rpc('get_employees_for_services', {
        p_service_ids: selectedServiceIds,
      });

      if (error) {
        showError("Erro ao buscar profissionais: " + error.message);
      } else {
        setAvailableEmployees(data || []);
      }
      setIsLoadingEmployees(false);
    };

    fetchAvailableEmployees();
  }, [selectedServices]);

  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!date || !selectedEmployeeId) {
        setBookedTimes([]);
        return;
      }

      setIsLoadingTimes(true);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('employee_id', selectedEmployeeId)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString());

      if (error) {
        showError("Erro ao buscar horários: " + error.message);
        setBookedTimes([]);
      } else {
        const times = data.map(appt => {
          const d = new Date(appt.appointment_date);
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        });
        setBookedTimes(times);
      }
      setIsLoadingTimes(false);
    };

    fetchBookedTimes();
  }, [date, selectedEmployeeId]);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  ];

  const availableTimeSlots = useMemo(() => {
    return timeSlots.filter(slot => !bookedTimes.includes(slot));
  }, [bookedTimes]);

  const handleSchedule = async () => {
    if (!date) {
      showError("Por favor, selecione uma data.");
      return;
    }
    if (!selectedTime) {
      showError("Por favor, selecione um horário.");
      return;
    }
    if (!selectedEmployeeId) {
      showError("Por favor, selecione um profissional.");
      return;
    }
    if (!selectedServices || selectedServices.length === 0) {
      showError("Ocorreu um erro, nenhum serviço selecionado.");
      return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const appointmentData = {
      client_name: clientName,
      client_whatsapp: clientWhatsapp,
      appointment_date: appointmentDate.toISOString(),
      services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price })),
      total_amount: totalAmount,
      employee_id: selectedEmployeeId,
    };

    const { error } = await supabase.from('appointments').insert([appointmentData]);

    setIsSubmitting(false);

    if (error) {
      showError("Erro ao criar agendamento: " + error.message);
      console.error(error);
    } else {
      showSuccess(`Agendamento para ${date.toLocaleDateString()} às ${selectedTime} confirmado!`);
      navigate("/");
    }
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
            <CardTitle className="text-xl font-semibold mb-4">1. Selecione o Profissional e a Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Profissional</h3>
              <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEmployees ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : availableEmployees.length > 0 ? (
                    availableEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-one" disabled>Nenhum profissional disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <fieldset disabled={!selectedEmployeeId} className="disabled:opacity-50">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow"
                  disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
                />
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold mb-4">2. Detalhes do Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset disabled={!selectedEmployeeId || !date}>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Selecione o Horário</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                  {isLoadingTimes ? (
                    Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))
                  ) : (
                    <p className="col-span-full text-center text-muted-foreground">
                      Nenhum horário disponível para esta data.
                    </p>
                  )}
                </div>
              </div>
            </fieldset>
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
            <Button onClick={handleSchedule} disabled={isSubmitting || !selectedTime} className="w-full mt-6 text-lg py-3">
              {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
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