"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, MoreHorizontal, Pencil, Trash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentEditDialog } from "@/components/admin/AppointmentEditDialog";

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
  status: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar agendamentos: " + error.message);
    } else {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  };

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    const { error } = await supabase.from("appointments").delete().eq("id", appointmentToDelete.id);
    if (error) {
      toast.error("Erro ao excluir agendamento: " + error.message);
    } else {
      toast.success("Agendamento excluído com sucesso!");
      fetchAppointments();
    }
    setIsDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const nameMatch = clientNameFilter
        ? appointment.client_name.toLowerCase().includes(clientNameFilter.toLowerCase())
        : true;
      const dateMatch = selectedDate
        ? isSameDay(new Date(appointment.appointment_date), selectedDate)
        : true;
      return nameMatch && dateMatch;
    });
  }, [appointments, clientNameFilter, selectedDate]);

  const clearFilters = () => {
    setClientNameFilter("");
    setSelectedDate(undefined);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Concluído": return "default";
      case "Confirmado": return "secondary";
      case "Cancelado": return "destructive";
      case "Pendente": return "outline";
      default: return "outline";
    }
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
              className={cn("w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum agendamento encontrado.
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
                        <Badge key={service.id} variant="secondary">{service.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(appointment.status)}>{appointment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {Number(appointment.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(appointment)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(appointment)} className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AppointmentEditDialog
        appointment={selectedAppointment}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onAppointmentUpdate={fetchAppointments}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o agendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}