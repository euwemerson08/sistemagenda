"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function SettingsManagementPage() {
  const [publicKey, setPublicKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_settings")
        .select("settings")
        .eq("provider", "MERCADO_PAGO")
        .single();

      if (data && data.settings) {
        setPublicKey(data.settings.publicKey || "");
        setAccessToken(data.settings.accessToken || "");
      } else if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        toast.error("Erro ao carregar configurações: " + error.message);
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    const settings = { publicKey, accessToken };

    const { error } = await supabase
      .from("payment_settings")
      .upsert({ provider: "MERCADO_PAGO", settings }, { onConflict: "provider" });

    setIsSubmitting(false);
    if (error) {
      toast.error("Erro ao salvar configurações: " + error.message);
    } else {
      toast.success("Configurações do Mercado Pago salvas com sucesso!");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Integração com Mercado Pago</CardTitle>
          <CardDescription>
            Insira suas credenciais do Mercado Pago para habilitar pagamentos online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p>Carregando configurações...</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="publicKey">Public Key</Label>
                <Input
                  id="publicKey"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="APP_USR-..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                />
              </div>
              <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Salvando..." : "Salvar Credenciais"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}