"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  client_name: string;
  client_whatsapp: string;
  appointment_date: string;
  services: Service[];
  total_amount: number;
  created_at: string;
  status: string; // Adicionado o campo status
}

// Função auxiliar para determinar a variante do Badge com base no status
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Confirmado":
      return "default"; // Geralmente azul escuro
    case "Pendente":
      return "secondary"; // Geralmente cinza claro
    case "Cancelado":
      return "destructive"; // Vermelho
    case "Concluído":
      return "outline"; // Borda
    default:
      return "secondary";
  }
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*, employee:employees(name)") // Seleciona o nome do funcionário
      .order("appointment_date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar agendamentos: " + error.message);
    } else {
      setAppointments(data);
    }
    setLoading(false);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      
      const nameMatch = clientNameFilter
        ? appointment.client_name.toLowerCase().includes(clientNameFilter.toLowerCase())
        : true;
        
      const dateMatch = selectedDate
        ? isSameDay(appointmentDate, selectedDate)
        : true;
        
      return nameMatch && dateMatch;
    });
  }, [appointments, clientNameFilter, selectedDate]);

  const clearFilters = () => {
    setClientNameFilter("");
    setSelectedDate(undefined);
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando agendamentos...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lista de Agendamentos</h1>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          placeholder="Filtrar por nome do cliente..."
          value={clientNameFilter}
          onChange={(e) => setClientNameFilter(e.target.value)}
          className="max-w-sm"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {(clientNameFilter || selectedDate) && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Data e Hora</TableHead>
              <TableHead>Serviços</TableHead>
              <TableHead>Status</TableHead> {/* Nova coluna para Status */}
              <TableHead className="text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center"> {/* Colspan ajustado */}
                  Nenhum agendamento encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    <div>{appointment.client_name}</div>
                    <div className="text-sm text-muted-foreground">{appointment.client_whatsapp}</div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {appointment.services.map((service) => (
                        <Badge key={service.id} variant="secondary">
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </TableCell> {/* Exibição do Status com Badge */}
                  <TableCell className="text-right">
                    R$ {Number(appointment.total_amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}