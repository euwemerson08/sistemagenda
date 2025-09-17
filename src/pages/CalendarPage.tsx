"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/components/SessionContextProvider";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

const CalendarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientName, clientWhatsapp, selectedServices, totalAmount, selectedEmployeeId } = (location.state || {}) as {
    clientName?: string;
    clientWhatsapp?: string;
    selectedServices?: Service[];
    totalAmount?: number;
    selectedEmployeeId?: string;
  };

  const { user } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const totalDuration = useMemo(() => {
    return selectedServices?.reduce((sum, service) => sum + (service.duration || 0), 0) || 0;
  }, [selectedServices]);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      setIsLoadingSettings(true);
      const { data, error } = await supabase
        .from("payment_settings")
        .select("settings")
        .eq("provider", "mercadopago")
        .single();

      if (data?.settings) {
        const settings = data.settings as { enabled: boolean };
        setIsPaymentEnabled(settings.enabled);
      } else if (error && error.code !== 'PGRST116') {
        showError("Erro ao carregar configurações de pagamento.");
      }
      setIsLoadingSettings(false);
    };

    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    if (date && selectedEmployeeId && totalDuration > 0) {
      const fetchAvailableSlots = async () => {
        setIsLoadingSlots(true);
        setAvailableSlots([]);
        setSelectedTime(null);

        const formattedDate = format(date, "yyyy-MM-dd");

        const { data, error } = await supabase.rpc('get_available_slots', {
          p_employee_id: selectedEmployeeId,
          p_appointment_date: formattedDate,
          p_total_duration: totalDuration,
        });

        if (error) {
          showError("Erro ao buscar horários disponíveis.");
          console.error(error);
        } else {
          const formattedSlots = data.map((slot: { available_slot: string }) => 
            slot.available_slot.substring(0, 5)
          );
          setAvailableSlots(formattedSlots);
        }
        setIsLoadingSlots(false);
      };

      fetchAvailableSlots();
    }
  }, [date, selectedEmployeeId, totalDuration]);

  const handleSchedule = async () => {
    if (!date || !selectedTime || !selectedServices || !selectedEmployeeId || !user) {
      showError("Por favor, preencha todos os campos para agendar.");
      return;
    }

    const loadingToast = showLoading("Criando agendamento...");
    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const appointmentData = {
      client_name: clientName,
      client_whatsapp: clientWhatsapp,
      appointment_date: appointmentDate.toISOString(),
      services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      total_amount: totalAmount,
      employee_id: selectedEmployeeId,
    };

    const { data: newAppointment, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select('id')
      .single();

    if (error || !newAppointment) {
      dismissToast(loadingToast);
      setIsSubmitting(false);
      showError("Erro ao criar agendamento: " + error?.message);
      return;
    }

    if (isPaymentEnabled) {
      dismissToast(loadingToast);
      const paymentToast = showLoading("Redirecionando para o pagamento...");

      try {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
          body: {
            appointmentId: newAppointment.id,
            services: selectedServices.map(s => ({ name: s.name, price: s.price })),
            clientName,
            clientEmail: user.email,
            origin: window.location.origin,
          },
        });

        if (paymentError) throw paymentError;

        window.location.href = paymentData.init_point;
      } catch (e: any) {
        dismissToast(paymentToast);
        setIsSubmitting(false);
        let errorMessage = e.message;
        // Check for a more specific error message from the function's response body
        if (e.context && e.context.error) {
          errorMessage = e.context.error;
        }
        showError("Erro ao iniciar pagamento: " + errorMessage);
      }
    } else {
      dismissToast(loadingToast);
      setIsSubmitting(false);
      showSuccess(`Agendamento para ${format(date, "dd/MM/yyyy")} às ${selectedTime} confirmado!`);
      navigate("/");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Agende Seu Horário</h1>

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
              disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
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
                {isLoadingSlots || isLoadingSettings ? (
                  Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                ) : availableSlots.length > 0 ? (
                  availableSlots.map((time) => (
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
                  <p className="col-span-full text-center text-muted-foreground">Nenhum horário disponível para esta data.</p>
                )}
              </div>
            </div>
            <Separator className="my-4" />
            {selectedServices && selectedServices.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {selectedServices.map((service) => (
                  <li key={service.id} className="flex justify-between items-center">
                    <span>{service.name} ({service.duration} min)</span>
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
            <Button onClick={handleSchedule} disabled={isSubmitting || !selectedTime || isLoadingSettings} className="w-full mt-6 text-lg py-3">
              {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
        <Link to="/services" state={{ clientName, clientWhatsapp }} className="text-sm text-blue-500 hover:underline">
          Voltar para seleção de serviços
        </Link>
      </div>
    </div>
  );
};

export default CalendarPage;