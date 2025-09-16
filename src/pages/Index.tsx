"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Importar Link
import { showError } from "@/utils/toast"; // Importar showError do utils/toast

const Index = () => {
  const [clientName, setClientName] = useState<string>("");
  const [clientWhatsapp, setClientWhatsapp] = useState<string>("");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!clientName.trim()) {
      showError("Por favor, insira seu nome para continuar.");
      return;
    }
    if (!clientWhatsapp.trim()) {
      showError("Por favor, insira seu número de WhatsApp para continuar.");
      return;
    }

    navigate("/services", { state: { clientName, clientWhatsapp } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-foreground p-4">
      <div className="text-center p-6 bg-card rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Seu Aplicativo</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Comece a construir seu projeto incrível aqui!
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <Label htmlFor="clientName" className="text-left block mb-2">Nome</Label>
            <Input
              id="clientName"
              placeholder="Seu nome"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="clientWhatsapp" className="text-left block mb-2">WhatsApp</Label>
            <Input
              id="clientWhatsapp"
              placeholder="(XX) XXXXX-XXXX"
              value={clientWhatsapp}
              onChange={(e) => setClientWhatsapp(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Button onClick={handleContinue} size="lg" className="text-lg px-8 py-4 w-full">
          Selecionar Serviços
        </Button>
        <div className="mt-4">
          <Link to="/admin" className="text-sm text-blue-500 hover:underline">
            Ir para o Painel de Administração
          </Link>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;