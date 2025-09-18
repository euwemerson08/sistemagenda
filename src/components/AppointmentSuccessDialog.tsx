"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface AppointmentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  whatsapp: string | null;
  address: string | null;
}

const AppointmentSuccessDialog: React.FC<AppointmentSuccessDialogProps> = ({
  isOpen,
  onClose,
  whatsapp,
  address,
}) => {
  const formattedWhatsapp = whatsapp ? whatsapp.replace(/\D/g, '') : '';
  const whatsappLink = formattedWhatsapp ? `https://wa.me/${formattedWhatsapp}` : '#';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader className="items-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <DialogTitle className="text-2xl font-bold">Agendamento Confirmado!</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Seu agendamento foi realizado com sucesso.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {whatsapp && (
            <p className="text-lg">
              Entre em contato:{" "}
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                {whatsapp}
              </a>
            </p>
          )}
          {address && (
            <p className="text-lg">
              Endereço: <span className="font-medium">{address}</span>
            </p>
          )}
          {!whatsapp && !address && (
            <p className="text-muted-foreground">Nenhuma informação de contato ou endereço disponível.</p>
          )}
        </div>
        <DialogFooter className="flex sm:justify-center">
          <Button onClick={onClose} asChild>
            <Link to="/">Voltar para o Início</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentSuccessDialog;