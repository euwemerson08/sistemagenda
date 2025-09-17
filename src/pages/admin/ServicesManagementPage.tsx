"use client";

import React, { useState, useEffect } from "react";
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
import { Pencil, Trash } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Omit<Service, "id" | "created_at">>({
    name: "",
    description: "",
    price: 0,
    duration: null,
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*");
    if (error) {
      toast.error("Erro ao carregar serviços: " + error.message);
    } else {
      setServices(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewService((prev) => ({
      ...prev,
      [name]: name === "price" || name === "duration" ? parseFloat(value) : value,
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingService) {
      setEditingService((prev) => ({
        ...prev!,
        [name]: name === "price" || name === "duration" ? parseFloat(value) : value,
      }));
    }
  };

  const handleSaveService = async () => {
    if (editingService) {
      const { id, ...updates } = editingService;
      const { error } = await supabase.from("services").update(updates).eq("id", id);
      if (error) {
        toast.error("Erro ao atualizar serviço: " + error.message);
      } else {
        toast.success("Serviço atualizado com sucesso!");
        fetchServices();
        setEditingService(null);
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from("services").insert([newService]);
      if (error) {
        toast.error("Erro ao adicionar serviço: " + error.message);
      } else {
        toast.success("Serviço adicionado com sucesso!");
        fetchServices();
        setNewService({ name: "", description: "", price: 0, duration: null });
        setIsDialogOpen(false);
      }
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar serviço: " + error.message);
    } else {
      toast.success("Serviço deletado com sucesso!");
      fetchServices();
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingService(null);
    setNewService({ name: "", description: "", price: 0, duration: null });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Serviços</h1>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={openAddDialog} className="mb-4">
            Adicionar Novo Serviço
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Serviço" : "Adicionar Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                value={editingService ? editingService.name : newService.name}
                onChange={editingService ? handleEditInputChange : handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Input
                id="description"
                name="description"
                value={editingService ? editingService.description || "" : newService.description || ""}
                onChange={editingService ? handleEditInputChange : handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Preço
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={editingService ? editingService.price : newService.price}
                onChange={editingService ? handleEditInputChange : handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duração (minutos)
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={editingService ? editingService.duration || "" : newService.duration || ""}
                onChange={editingService ? handleEditInputChange : handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveService}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Duração (minutos)</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>{service.description}</TableCell>
              <TableCell>R$ {service.price.toFixed(2)}</TableCell>
              <TableCell>{service.duration ? `${service.duration} min` : "N/A"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}