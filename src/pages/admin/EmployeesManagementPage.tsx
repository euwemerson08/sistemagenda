"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  services: Service[];
}

type EmployeeFormData = Omit<Employee, "id" | "services"> & { service_ids: string[] };

export default function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({ name: "", email: "", phone: "", service_ids: [] });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchEmployees(), fetchServices()]);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("id, name");
    if (error) toast.error("Erro ao carregar serviços: " + error.message);
    else setAllServices(data);
  };

  const fetchEmployees = async () => {
    const { data: employeesData, error: employeesError } = await supabase.from("employees").select("*");
    if (employeesError) {
      toast.error("Erro ao carregar funcionários: " + employeesError.message);
      return;
    }

    const { data: relationsData, error: relationsError } = await supabase.from("employee_services").select("*");
    if (relationsError) {
      toast.error("Erro ao carregar serviços dos funcionários: " + relationsError.message);
      return;
    }

    const employeesWithServices = employeesData.map(emp => {
      const empServiceIds = relationsData.filter(r => r.employee_id === emp.id).map(r => r.service_id);
      const services = allServices.filter(s => empServiceIds.includes(s.id));
      return { ...emp, services };
    });

    setEmployees(employeesWithServices);
  };
  
  useEffect(() => {
    if (allServices.length > 0) {
        fetchEmployees();
    }
  }, [allServices]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => {
      const service_ids = prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId];
      return { ...prev, service_ids };
    });
  };

  const openAddDialog = () => {
    setEditingEmployee(null);
    setFormData({ name: "", email: "", phone: "", service_ids: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      service_ids: employee.services.map(s => s.id),
    });
    setIsDialogOpen(true);
  };

  const handleSaveEmployee = async () => {
    const employeeData = { name: formData.name, email: formData.email, phone: formData.phone };

    let employeeId = editingEmployee?.id;

    if (editingEmployee) {
      const { error } = await supabase.from("employees").update(employeeData).eq("id", editingEmployee.id);
      if (error) return toast.error("Erro ao atualizar funcionário: " + error.message);
    } else {
      const { data, error } = await supabase.from("employees").insert(employeeData).select("id").single();
      if (error) return toast.error("Erro ao adicionar funcionário: " + error.message);
      employeeId = data.id;
    }

    if (!employeeId) return;

    const { error: deleteError } = await supabase.from("employee_services").delete().eq("employee_id", employeeId);
    if (deleteError) return toast.error("Erro ao atualizar serviços do funcionário: " + deleteError.message);

    if (formData.service_ids.length > 0) {
      const relations = formData.service_ids.map(service_id => ({ employee_id: employeeId!, service_id }));
      const { error: insertError } = await supabase.from("employee_services").insert(relations);
      if (insertError) return toast.error("Erro ao associar serviços: " + insertError.message);
    }

    toast.success(`Funcionário ${editingEmployee ? 'atualizado' : 'adicionado'} com sucesso!`);
    setIsDialogOpen(false);
    fetchData();
  };

  const handleDeleteEmployee = async (id: string) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) toast.error("Erro ao deletar funcionário: " + error.message);
    else {
      toast.success("Funcionário deletado com sucesso!");
      fetchData();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Funcionários</h1>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={openAddDialog} className="mb-4">Adicionar Funcionário</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Editar Funcionário" : "Adicionar Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" value={formData.email || ""} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Telefone</Label>
              <Input id="phone" name="phone" value={formData.phone || ""} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Serviços</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full col-span-3 justify-between">
                    {formData.service_ids.length > 0 ? `${formData.service_ids.length} selecionado(s)` : "Selecione os serviços..."}
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
                            <Check className={cn("mr-2 h-4 w-4", formData.service_ids.includes(service.id) ? "opacity-100" : "opacity-0")} />
                            {service.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveEmployee}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Serviços</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
          ) : employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>
                <div>{employee.email}</div>
                <div className="text-sm text-muted-foreground">{employee.phone}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {employee.services.map(s => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(employee)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(employee.id)}><Trash className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}