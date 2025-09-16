"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ServiceForm from "@/components/admin/ServiceForm";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
}

const ServicesManagementPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    if (error) {
      showError("Erro ao carregar serviços: " + error.message);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleAddService = async (values: Omit<Service, "id">) => {
    setIsSubmitting(true);
    const { data, error } = await supabase.from("services").insert(values).select();
    if (error) {
      showError("Erro ao adicionar serviço: " + error.message);
    } else {
      showSuccess("Serviço adicionado com sucesso!");
      setServices((prev) => [data[0], ...prev]);
      setIsFormOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdateService = async (values: Omit<Service, "id">) => {
    if (!editingService?.id) return;
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("services")
      .update(values)
      .eq("id", editingService.id)
      .select();
    if (error) {
      showError("Erro ao atualizar serviço: " + error.message);
    } else {
      showSuccess("Serviço atualizado com sucesso!");
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? data[0] : s))
      );
      setIsFormOpen(false);
      setEditingService(undefined);
    }
    setIsSubmitting(false);
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      showError("Erro ao excluir serviço: " + error.message);
    } else {
      showSuccess("Serviço excluído com sucesso!");
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (values: Omit<Service, "id">) => {
    if (editingService) {
      handleUpdateService(values);
    } else {
      handleAddService(values);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Serviços</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingService(undefined)}>Adicionar Serviço</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingService ? "Editar Serviço" : "Adicionar Novo Serviço"}</DialogTitle>
            </DialogHeader>
            <ServiceForm
              initialData={editingService}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando serviços...</p>
          ) : services.length === 0 ? (
            <p>Nenhum serviço encontrado. Adicione um novo serviço.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.description || "N/A"}</TableCell>
                      <TableCell>R$ {service.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço "{service.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesManagementPage;