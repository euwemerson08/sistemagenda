"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import EmployeeForm from "@/components/admin/EmployeeForm";

interface Service {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  services: { service_id: string }[];
}

interface EmployeeWithServiceNames extends Omit<Employee, 'services'> {
  services: Service[];
}

export default function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<EmployeeWithServiceNames[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithServiceNames | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeWithServiceNames | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const servicesPromise = supabase.from("services").select("id, name");
    const employeesPromise = supabase.from("employees").select("*, employee_services(service_id)");

    const [{ data: servicesData, error: servicesError }, { data: employeesData, error: employeesError }] = await Promise.all([servicesPromise, employeesPromise]);

    if (servicesError || employeesError) {
      toast.error(servicesError?.message || employeesError?.message || "Erro ao carregar dados.");
    } else {
      setAllServices(servicesData || []);
      const employeesWithServiceNames = (employeesData as any[] || []).map(emp => {
        const serviceDetails = emp.employee_services.map((es: { service_id: string }) => {
          return servicesData?.find(s => s.id === es.service_id) || { id: es.service_id, name: 'Desconhecido' };
        });
        return { ...emp, services: serviceDetails };
      });
      setEmployees(employeesWithServiceNames);
    }
    setLoading(false);
  };

  const handleFormSubmit = async (values: { name: string; email?: string; phone?: string; service_ids: string[] }) => {
    setIsSubmitting(true);
    
    const employeeData = { name: values.name, email: values.email, phone: values.phone };

    if (editingEmployee) {
      // Update employee
      const { error: updateError } = await supabase.from("employees").update(employeeData).eq("id", editingEmployee.id);
      if (updateError) {
        toast.error("Erro ao atualizar funcionário: " + updateError.message);
        setIsSubmitting(false);
        return;
      }
      // Update services
      await supabase.from("employee_services").delete().eq("employee_id", editingEmployee.id);
      const servicesToInsert = values.service_ids.map(service_id => ({ employee_id: editingEmployee.id, service_id }));
      const { error: servicesError } = await supabase.from("employee_services").insert(servicesToInsert);
      if (servicesError) {
        toast.error("Erro ao atualizar serviços do funcionário: " + servicesError.message);
      } else {
        toast.success("Funcionário atualizado com sucesso!");
      }
    } else {
      // Create employee
      const { data: newEmployee, error: createError } = await supabase.from("employees").insert(employeeData).select().single();
      if (createError) {
        toast.error("Erro ao criar funcionário: " + createError.message);
        setIsSubmitting(false);
        return;
      }
      // Add services
      const servicesToInsert = values.service_ids.map(service_id => ({ employee_id: newEmployee.id, service_id }));
      const { error: servicesError } = await supabase.from("employee_services").insert(servicesToInsert);
      if (servicesError) {
        toast.error("Erro ao associar serviços: " + servicesError.message);
      } else {
        toast.success("Funcionário criado com sucesso!");
      }
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
    setEditingEmployee(null);
    fetchData();
  };

  const handleDeleteClick = (employee: EmployeeWithServiceNames) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    const { error } = await supabase.from("employees").delete().eq("id", employeeToDelete.id);
    if (error) {
      toast.error("Erro ao excluir funcionário: " + error.message);
    } else {
      toast.success("Funcionário excluído com sucesso!");
      fetchData();
    }
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const openEditDialog = (employee: EmployeeWithServiceNames) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

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
          <EmployeeForm
            initialData={editingEmployee ? { ...editingEmployee, service_ids: editingEmployee.services.map(s => s.id) } : undefined}
            allServices={allServices}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
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
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>
                  <div>{employee.email}</div>
                  <div className="text-sm text-muted-foreground">{employee.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {employee.services.map(service => (
                      <Badge key={service.id} variant="secondary">{service.name}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(employee)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(employee)} className="text-red-600"><Trash className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {employeeToDelete?.name}? Esta ação não pode ser desfeita.
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