"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, DollarSign, Users, ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number | null;
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
      return "default";
    case "Pendente":
      return "secondary";
    case "Em Atendimento":
      return "default";
    case "Cancelado":
      return "destructive";
    case "Concluído":
      return "outline";
    default:
      return "secondary";
  }
};

export default function ReportsPage() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [displayedStartDate, setDisplayedStartDate] = useState<string | null>(null);
  const [displayedEndDate, setDisplayedEndDate] = useState<string | null>(null);
  const [displayedEmployeeId, setDisplayedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchAppointments(), fetchEmployees()]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, employee:employees(name)")
      .order("appointment_date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar agendamentos: " + error.message);
    } else {
      setAllAppointments(data as Appointment[]);
    }
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("id, name");
    if (error) toast.error("Erro ao carregar funcionários: " + error.message);
    else setAllEmployees(data || []);
  };

  const filteredAppointments = useMemo(() => {
    let filtered = allAppointments;

    if (displayedStartDate && displayedEndDate) {
      const start = parseISO(displayedStartDate + 'T00:00:00');
      const end = parseISO(displayedEndDate + 'T23:59:59');
      filtered = filtered.filter(appointment => {
        const appointmentDate = parseISO(appointment.appointment_date);
        return isWithinInterval(appointmentDate, { start, end });
      });
    }

    if (displayedEmployeeId) {
      filtered = filtered.filter(appointment => appointment.employee_id === displayedEmployeeId);
    }

    return filtered;
  }, [allAppointments, displayedStartDate, displayedEndDate, displayedEmployeeId]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredAppointments.reduce((sum, appointment) => sum + appointment.total_amount, 0);
  }, [filteredAppointments]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione as datas de início e fim.");
      return;
    }
    setDisplayedStartDate(startDate);
    setDisplayedEndDate(endDate);
    setDisplayedEmployeeId(selectedEmployeeId);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedEmployeeId(null); // Define como null para "Todos os funcionários"
    setDisplayedStartDate(null);
    setDisplayedEndDate(null);
    setDisplayedEmployeeId(null);
  };

  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return dateString;
    }
  };

  const isReportGenerated = displayedStartDate && displayedEndDate;

  if (loading) {
    return <div className="p-4 text-center">Carregando dados para relatórios...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalFilteredRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {isReportGenerated ? `No período de ${formatDisplayDate(displayedStartDate)} a ${formatDisplayDate(displayedEndDate)}` : "Selecione um período"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Concluídos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAppointments.filter(a => a.status === "Concluído").length}</div>
            <p className="text-xs text-muted-foreground">Agendamentos concluídos no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Totais</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Total de agendamentos no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionário Selecionado</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayedEmployeeId ? allEmployees.find(emp => emp.id === displayedEmployeeId)?.name : "Todos"}
            </div>
            <p className="text-xs text-muted-foreground">Profissional filtrado</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
          <CardDescription>Selecione um período e/ou funcionário para gerar relatórios específicos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="employee-filter">Funcionário</Label>
              <Select
                onValueChange={(value) => setSelectedEmployeeId(value === "all" ? null : value)}
                value={selectedEmployeeId || "all"}
              >
                <SelectTrigger id="employee-filter">
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {allEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="w-full" onClick={handleGenerateReport}>Gerar Relatório</Button>
            {(displayedStartDate || displayedEmployeeId) && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isReportGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos Detalhados</CardTitle>
            <CardDescription>
              Lista de agendamentos de{" "}
              <span className="font-medium">{formatDisplayDate(displayedStartDate)}</span> a{" "}
              <span className="font-medium">{formatDisplayDate(displayedEndDate)}</span>
              {displayedEmployeeId && ` para ${allEmployees.find(emp => emp.id === displayedEmployeeId)?.name}`}.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
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
                          {format(parseISO(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}