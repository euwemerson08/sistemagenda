"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface StoreSettings {
  id?: string;
  whatsapp: string | null;
  address: string | null;
}

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({ whatsapp: null, address: null });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("store_settings").select("*").single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      toast.error("Erro ao carregar configurações da loja: " + error.message);
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    const { id, ...dataToSave } = settings;

    let error = null;
    if (id) {
      const { error: updateError } = await supabase.from("store_settings").update(dataToSave).eq("id", id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("store_settings").insert(dataToSave);
      error = insertError;
    }

    setIsSubmitting(false);
    if (error) {
      toast.error("Erro ao salvar configurações: " + error.message);
    } else {
      toast.success("Configurações da loja salvas com sucesso!");
      fetchStoreSettings(); // Re-fetch to get the ID if it was an insert
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando configurações...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Configurações da Loja</h1>

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Informações de Contato e Endereço</CardTitle>
          <CardDescription>Gerencie o WhatsApp e o endereço que serão exibidos aos clientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsapp">WhatsApp da Loja</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={settings.whatsapp || ""}
              onChange={handleInputChange}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <div>
            <Label htmlFor="address">Endereço da Loja</Label>
            <Textarea
              id="address"
              name="address"
              value={settings.address || ""}
              onChange={handleInputChange}
              placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
              rows={3}
            />
          </div>
          <Button onClick={handleSaveSettings} disabled={isSubmitting} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}