"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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
  employee_id: string;
  status: string;
}

const appointmentFormSchema = z.object({
  client_name: z.string().min(1, "O nome do cliente é obrigatório."),
  client_whatsapp: z.string().min(10, "O WhatsApp parece inválido."),
  selectedServiceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço."),
  selectedEmployeeId: z.string().min(1, "Selecione um funcionário."),
  date: z.date({ required_error: "Selecione uma data para o agendamento." }),
  selectedTime: z.string().min(1, "Selecione um horário para o agendamento."),
  status: z.string().min(1, "Selecione um status."),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Appointment | null;
  allServices: Service[];
  allEmployees: Employee[];
  onSave: () => void;
}

const statusOptions = ["Pendente", "Confirmado", "Concluído", "Cancelado"];

export const AppointmentFormDialog: React.FC<AppointmentFormDialogProps> = ({
  isOpen,
  onClose,
  initialData,
  allServices,
  allEmployees,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      client_name: initialData?.client_name || "",
      client_whatsapp: initialData?.client_whatsapp || "",
      selectedServiceIds: initialData?.services.map(s => s.id) || [],
      selectedEmployeeId: initialData?.employee_id || "",
      date: initialData ? new Date(initialData.appointment_date) : new Date(),
      selectedTime: initialData ? format(new Date(initialData.appointment_date), "HH:mm") : "",
      status: initialData?.status || "Pendente",
    },
  });

  const { watch, setValue, reset } = form;
  const watchedDate = watch("date");
  const watchedSelectedServiceIds = watch("selectedServiceIds");
  const watchedSelectedEmployeeId = watch("selectedEmployeeId");

  const selectedServices = useMemo(() => {
    return allServices.filter(s => watchedSelectedServiceIds.includes(s.id));
  }, [watchedSelectedServiceIds, allServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + (service.duration || 0), 0);
  }, [selectedServices]);

  const totalAmount = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  }, [selectedServices]);

  useEffect(() => {
    if (isOpen) {
      reset({
        client_name: initialData?.client_name || "",
        client_whatsapp: initialData?.client_whatsapp || "",
        selectedServiceIds: initialData?.services.map(s => s.id) || [],
        selectedEmployeeId: initialData?.employee_id || "",
        date: initialData ? new Date(initialData.appointment_date) : new Date(),
        selectedTime: initialData ? format(new Date(initialData.appointment_date), "HH:mm") : "",
        status: initialData?.status || "Pendente",
      });
    }
  }, [isOpen, initialData, reset]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (watchedDate && watchedSelectedEmployeeId && totalDuration > 0) {
        setIsLoadingSlots(true);
        setAvailableSlots([]);
        setValue("selectedTime", "");

        const formattedDate = format(watchedDate, "yyyy-MM-dd");

        const { data, error } = await supabase.rpc('get_available_slots', {
          p_employee_id: watchedSelectedEmployeeId,
          p_appointment_date: formattedDate,
          p_total_duration: totalDuration,
        });

        if (error) {
          toast.error("Erro ao buscar horários disponíveis: " + error.message);
          console.error(error);
        } else {
          const formatted = data.map((slot: { available_slot: string }) => 
            slot.available_slot.substring(0, 5)
          );
          setAvailableSlots(formatted);
        }
        setIsLoadingSlots(false);
      } else {
        setAvailableSlots([]);
        setValue("selectedTime", "");
      }
    };

    fetchSlots();
  }, [watchedDate, watchedSelectedEmployeeId, totalDuration, setValue]);

  const handleServiceToggle = (serviceId: string) => {
    const currentSelected = new Set(form.getValues("selectedServiceIds"));
    if (currentSelected.has(serviceId)) {
      currentSelected.delete(serviceId);
    } else {
      currentSelected.add(serviceId);
    }
    form.setValue("selectedServiceIds", Array.from(currentSelected), { shouldValidate: true });
  };

  const onSubmit = async (values: AppointmentFormValues) => {
    setIsSubmitting(true);

    const [hours, minutes] = values.selectedTime.split(':').map(Number);
    const appointmentDateTime = new Date(values.date);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const appointmentData = {
      client_name: values.client_name,
      client_whatsapp: values.client_whatsapp,
      appointment_date: appointmentDateTime.toISOString(),
      services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      total_amount: totalAmount,
      employee_id: values.selectedEmployeeId,
      status: values.status,
    };

    let error = null;
    if (initialData) {
      const { error: updateError } = await supabase
        .from("appointments")
        .update(appointmentData)
        .eq("id", initialData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("appointments")
        .insert([appointmentData]);
      error = insertError;
    }

    setIsSubmitting(false);
    if (error) {
      toast.error("Erro ao salvar agendamento: " + error.message);
    } else {
      toast.success(`Agendamento ${initialData ? 'atualizado' : 'criado'} com sucesso!`);
      onSave();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Agendamento" : "Criar Novo Agendamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_name" className="text-right">Nome Cliente</Label>
            <Input id="client_name" {...form.register("client_name")} className="col-span-3" />
            {form.formState.errors.client_name && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.client_name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_whatsapp" className="text-right">WhatsApp</Label>
            <Input id="client_whatsapp" {...form.register("client_whatsapp")} className="col-span-3" />
            {form.formState.errors.client_whatsapp && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.client_whatsapp.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Serviços</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full col-span-3 justify-between">
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
                        <CommandItem
                          key={service.id}
                          onSelect={() => handleServiceToggle(service.id)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", watchedSelectedServiceIds.includes(service.id) ? "opacity-100" : "opacity-0")} />
                          {service.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.selectedServiceIds && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.selectedServiceIds.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Funcionário</Label>
            <Select
              onValueChange={(value) => form.setValue("selectedEmployeeId", value, { shouldValidate: true })}
              value={watchedSelectedEmployeeId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {allEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.formState.errors.selectedEmployeeId && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.selectedEmployeeId.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full col-span-3 justify-start text-left font-normal",
                    !watchedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedDate ? format(watchedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={watchedDate}
                  onSelect={(date) => form.setValue("date", date || new Date(), { shouldValidate: true })}
                  initialFocus
                  disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.date && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Horário</Label>
            <div className="col-span-3 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
              {isLoadingSlots ? (
                Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              ) : availableSlots.length > 0 ? (
                availableSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={form.getValues("selectedTime") === time ? "default" : "outline"}
                    onClick={() => form.setValue("selectedTime", time, { shouldValidate: true })}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground text-sm">Nenhum horário disponível.</p>
              )}
            </div>
            {form.formState.errors.selectedTime && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.selectedTime.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <Select
              onValueChange={(value) => form.setValue("status", value, { shouldValidate: true })}
              value={form.getValues("status")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.formState.errors.status && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.status.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Valor Total</Label>
            <Input value={`R$ ${totalAmount.toFixed(2)}`} readOnly className="col-span-3 bg-muted" />
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};