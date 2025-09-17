"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface MercadoPagoSettings {
  enabled: boolean;
}

const PaymentSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<MercadoPagoSettings>({ enabled: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_settings")
        .select("settings")
        .eq("provider", "mercadopago")
        .single();

      if (data?.settings) {
        setSettings(data.settings as MercadoPagoSettings);
      } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        toast.error("Erro ao carregar configurações: " + error.message);
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from("payment_settings")
      .upsert({ provider: "mercadopago", settings }, { onConflict: "provider" });

    setIsSubmitting(false);
    if (error) {
      toast.error("Erro ao salvar configurações: " + error.message);
    } else {
      toast.success("Configurações salvas com sucesso!");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Configurações de Pagamento</h1>

      <Card>
        <CardHeader>
          <CardTitle>Mercado Pago</CardTitle>
          <CardDescription>
            Configure a integração com o Mercado Pago para aceitar pagamentos online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="mp-enabled" className="text-base">Ativar Mercado Pago</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que clientes paguem pelos agendamentos online.
              </p>
            </div>
            <Switch
              id="mp-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              disabled={loading}
            />
          </div>

          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Ação Necessária: Configurar Chaves</AlertTitle>
            <AlertDescription className="space-y-4 mt-2">
              <p>
                Para que a integração funcione, você precisa configurar suas chaves de API do Mercado Pago em locais seguros.
                Isso é feito fora deste painel para garantir a segurança máxima.
              </p>
              <div>
                <Label className="font-semibold">1. Access Token (Chave Secreta)</Label>
                <p className="text-sm text-muted-foreground">
                  Adicione esta chave como um "Secret" no seu projeto Supabase com o nome <code className="bg-muted p-1 rounded">MERCADO_PAGO_ACCESS_TOKEN</code>.
                  <a href="#" onClick={() => alert('Link para o painel de Edge Functions do Supabase')} className="text-blue-500 hover:underline ml-2">
                    Ir para o painel de Secrets
                  </a>
                </p>
              </div>
              <div>
                <Label className="font-semibold">2. Public Key (Chave Pública)</Label>
                <p className="text-sm text-muted-foreground">
                  Adicione esta chave ao seu arquivo <code className="bg-muted p-1 rounded">.env</code> na raiz do projeto como: <br />
                  <code className="bg-muted p-1 rounded">VITE_MERCADO_PAGO_PUBLIC_KEY=SUA_CHAVE_PUBLICA</code>
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSubmitting || loading}>
            {isSubmitting ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSettingsPage;