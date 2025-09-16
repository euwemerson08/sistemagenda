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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, isSameDay, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, MoreHorizontal, Pencil, Trash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentEditDialog } from "@/components/admin/AppointmentEditDialog";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Employee {
  id: string;
  name: string;
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
  employee_id: string | null;
  employees: { name: string } | null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const appointmentsPromise = supabase
      .from("appointments")
      .select("*, employees(name)")
      .order("appointment_date", { ascending: false });
    const employeesPromise = supabase.from("employees").select("id, name");

    const [{ data: appointmentsData, error: appointmentsError }, { data: employeesData, error: employeesError }] = await Promise.all([appointmentsPromise, employeesPromise]);

    if (appointmentsError || employeesError) {
      toast.error(appointmentsError?.message || employeesError?.message || "Erro ao carregar dados.");
    } else {
      setAppointments(appointmentsData as Appointment[]);
      setAllEmployees(employeesData || []);
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
      fetchData();
    }
    setIsDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      const nameMatch = clientNameFilter
        ? appointment.client_name.toLowerCase().includes(clientNameFilter.toLowerCase())
        : true;
      const dateMatch = selectedDate && isValid(appointmentDate)
        ? isSameDay(appointmentDate, selectedDate)
        : !selectedDate;
      const employeeMatch = selectedEmployeeFilter
        ? appointment.employee_id === selectedEmployeeFilter
        : true;
      return nameMatch && dateMatch && employeeMatch;
    });
  }, [appointments, clientNameFilter, selectedDate, selectedEmployeeFilter]);

  const clearFilters = () => {
    setClientNameFilter("");
    setSelectedDate(undefined);
    setSelectedEmployeeFilter("");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isValid(date)) {
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
    return "Data inválida";
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
        <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrar por profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os Profissionais</SelectItem>
            {allEmployees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(clientNameFilter || selectedDate || selectedEmployeeFilter) && (
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
              <TableHead>Profissional</TableHead>
              <TableHead>Serviços</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
                    {formatDate(appointment.appointment_date)}
                  </TableCell>
                  <TableCell>{appointment.employees?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(appointment.services) &&
                        appointment.services.map((service, index) =>
                          service && typeof service === 'object' && service.name ? (
                            <Badge key={service.id || index} variant="secondary">
                              {service.name}
                            </Badge>
                          ) : null
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(appointment.status)}>{appointment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {typeof appointment.total_amount === 'number' ? appointment.total_amount.toFixed(2) : '0.00'}
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
        allEmployees={allEmployees}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onAppointmentUpdate={fetchData}
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