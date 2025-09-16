"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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

export default function NewAppointmentPage() {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: servicesData, error: servicesError } = await supabase.from("services").select("*");
      if (servicesError) toast.error("Erro ao carregar serviços.");
      else setAllServices(servicesData);

      const { data: employeesData, error: employeesError } = await supabase.from("employees").select("id, name");
      if (employeesError) toast.error("Erro ao carregar funcionários.");
      else setAllEmployees(employeesData);
    };
    fetchData();
  }, []);

  const selectedServices = useMemo(() => {
    return allServices.filter(s => selectedServiceIds.has(s.id));
  }, [selectedServiceIds, allServices]);

  const totalAmount = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  }, [selectedServices]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  ];

  const handleSaveAppointment = async () => {
    if (!clientName || !clientWhatsapp || selectedServices.length === 0 || !selectedEmployeeId || !date || !selectedTime) {
      return toast.error("Por favor, preencha todos os campos obrigatórios.");
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
      status: 'Confirmado',
    };

    const { error } = await supabase.from('appointments').insert([appointmentData]);
    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao criar agendamento: " + error.message);
    } else {
      toast.success("Agendamento criado com sucesso!");
      navigate("/admin/appointments");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Novo Agendamento</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="clientWhatsapp">WhatsApp</Label>
                <Input id="clientWhatsapp" value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Serviços e Funcionário</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Serviços</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {selectedServices.length > 0 ? `${selectedServices.length} selecionado(s)` : "Selecione os serviços..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar serviço..." />
                      <CommandList>
                        <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                        <CommandGroup>
                          {allServices.map((service) => (
                            <CommandItem key={service.id} onSelect={() => handleServiceToggle(service.id)}>
                              <Check className={cn("mr-2 h-4 w-4", selectedServiceIds.has(service.id) ? "opacity-100" : "opacity-0")} />
                              {service.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Funcionário</Label>
                <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId || undefined}>
                  <SelectTrigger><SelectValue placeholder="Selecione um funcionário" /></SelectTrigger>
                  <SelectContent>
                    {allEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Data e Hora</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
              <div className="flex justify-center">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border shadow" />
              </div>
              <div>
                <Label className="mb-2 block">Horário</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-2">
                  {timeSlots.map(time => (
                    <Button key={time} variant={selectedTime === time ? "default" : "outline"} onClick={() => setSelectedTime(time)}>
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader><CardTitle>Resumo do Agendamento</CardTitle></CardHeader>
            <CardContent>
              {selectedServices.length === 0 ? (
                <p className="text-muted-foreground">Selecione os serviços.</p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {selectedServices.map(s => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.name}</span>
                      <span>R$ {s.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>R$ {totalAmount.toFixed(2)}</span>
              </div>
              <Button onClick={handleSaveAppointment} disabled={isSubmitting} className="w-full mt-6">
                {isSubmitting ? "Salvando..." : "Salvar Agendamento"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}