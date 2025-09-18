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
import { Calendar as CalendarIcon, X, Pencil, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentFormDialog } from "@/components/admin/AppointmentFormDialog";
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

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number | null; // Adicionado duration para o diálogo
}

interface Employee {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  client_name: string;
  client_whatsapp: string;
  appointment_date: string; // ISO string
  services: { id: string; name: string; price: number; duration: number | null }[];
  total_amount: number;
  created_at: string;
  status: string;
  employee_id: string;
  employee: { name: string } | null; // Para exibir o nome do funcionário
  payment_status: string;
  payment_id: string | null;
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
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchAppointments(), fetchServices(), fetchEmployees()]);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("id, name, price, duration");
    if (error) toast.error("Erro ao carregar serviços: " + error.message);
    else setAllServices(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("id, name");
    if (error) toast.error("Erro ao carregar funcionários: " + error.message);
    else setAllEmployees(data || []);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, employee:employees(name)")
      .order("appointment_date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar agendamentos: " + error.message);
    } else {
      setAppointments(data as Appointment[]);
    }
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

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (appointmentToDelete) {
      const { error } = await supabase.from("appointments").delete().eq("id", appointmentToDelete);
      if (error) {
        toast.error("Erro ao deletar agendamento: " + error.message);
      } else {
        toast.success("Agendamento deletado com sucesso!");
        fetchAppointments();
      }
      setAppointmentToDelete(null);
      setIsDeleteDialogOpen(false);
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
              <TableHead>Profissional</TableHead>
              <TableHead>Data e Hora</TableHead>
              <TableHead>Serviços</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Ações</TableHead> {/* Nova coluna para ações */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
                  <TableCell>{appointment.employee?.name || "N/A"}</TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {Number(appointment.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(appointment)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(appointment.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de Edição */}
      <AppointmentFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        initialData={editingAppointment}
        allServices={allServices}
        allEmployees={allEmployees}
        onSave={fetchAppointments}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente este agendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}