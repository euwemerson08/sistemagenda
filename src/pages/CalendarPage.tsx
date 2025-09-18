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
import { ptBR } from "date-fns/locale"; // Importar locale para formatação
import { Skeleton } from "@/components/ui/skeleton";
import AppointmentSuccessDialog from "@/components/AppointmentSuccessDialog";

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

interface StoreSettings {
  whatsapp: string | null;
  address: string | null;
}

interface ConfirmedAppointmentDetails {
  date: Date;
  time: string;
  employeeName: string;
  services: Service[];
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

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({ whatsapp: null, address: null });
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // Novo estado para todos os funcionários
  const [confirmedAppointmentDetails, setConfirmedAppointmentDetails] = useState<ConfirmedAppointmentDetails | null>(null); // Novo estado para detalhes do agendamento confirmado

  const totalDuration = useMemo(() => {
    return selectedServices?.reduce((sum, service) => sum + (service.duration || 0), 0) || 0;
  }, [selectedServices]);

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase.from("employees").select("id, name");
      if (employeesError) {
        console.error("Erro ao carregar funcionários:", employeesError.message);
      } else {
        setAllEmployees(employeesData);
      }

      // Fetch available slots
      if (date && selectedEmployeeId && totalDuration > 0) {
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
          const now = new Date();
          const today = format(now, "yyyy-MM-dd");
          const isToday = formattedDate === today;

          const filteredAndFormattedSlots = data
            .map((slot: { available_slot: string }) => slot.available_slot.substring(0, 5))
            .filter((timeSlot: string) => {
              if (isToday) {
                const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
                const slotDateTime = new Date(date);
                slotDateTime.setHours(slotHours, slotMinutes, 0, 0);
                return slotDateTime > now; // Apenas horários futuros para o dia de hoje
              }
              return true; // Todos os horários disponíveis para dias futuros
            });
          setAvailableSlots(filteredAndFormattedSlots);
        }
        setIsLoadingSlots(false);
      }

      // Fetch store settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("store_settings")
        .select("whatsapp, address")
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("Erro ao carregar configurações da loja:", settingsError.message);
      } else if (settingsData) {
        setStoreSettings(settingsData);
      }
    };

    fetchInitialData();
  }, [date, selectedEmployeeId, totalDuration]);

  const handleSchedule = async () => {
    if (!date || !selectedTime || !selectedServices || !selectedEmployeeId) {
      showError("Por favor, preencha todos os campos para agendar.");
      return;
    }

    const loadingToast = showLoading("Confirmando agendamento...");
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
      payment_status: 'pending',
    };

    const { data: newAppointment, error } = await supabase.from('appointments').insert([appointmentData]).select().single();
    
    dismissToast(loadingToast);
    setIsSubmitting(false);

    if (error) {
      showError("Erro ao criar agendamento: " + error.message);
    } else if (newAppointment) {
      const employeeName = allEmployees.find(emp => emp.id === selectedEmployeeId)?.name || "Profissional Desconhecido";
      setConfirmedAppointmentDetails({
        date: date,
        time: selectedTime,
        employeeName: employeeName,
        services: selectedServices,
      });
      setShowSuccessDialog(true);
    } else {
      showError("Erro desconhecido ao criar agendamento.");
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    navigate("/"); // Redireciona para a página inicial após fechar o diálogo
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
                {isLoadingSlots ? (
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
            <Button onClick={handleSchedule} disabled={isSubmitting || !selectedTime} className="w-full mt-6 text-lg py-3">
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

      <AppointmentSuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        whatsapp={storeSettings.whatsapp}
        address={storeSettings.address}
        appointmentDetails={confirmedAppointmentDetails}
      />
    </div>
  );
};

export default CalendarPage;