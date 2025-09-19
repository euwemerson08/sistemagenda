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
import { CheckCircle, MessageCircleMore, Instagram } from "lucide-react"; // Importar Instagram
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

interface ConfirmedAppointmentDetails {
  date: Date;
  time: string;
  employeeName: string;
  services: Service[];
}

interface AppointmentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  whatsapp: string | null;
  address: string | null;
  instagramUrl: string | null; // Novo prop para Instagram
  appointmentDetails: ConfirmedAppointmentDetails | null; // Novo prop
}

const AppointmentSuccessDialog: React.FC<AppointmentSuccessDialogProps> = ({
  isOpen,
  onClose,
  whatsapp,
  address,
  instagramUrl, // Receber instagramUrl
  appointmentDetails,
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
          {appointmentDetails && (
            <div className="space-y-2 text-left p-3 bg-muted rounded-md">
              <p className="text-base font-semibold">Detalhes do Agendamento:</p>
              <p>
                <span className="font-medium">Data:</span>{" "}
                {format(appointmentDetails.date, "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {appointmentDetails.time}
              </p>
              <p>
                <span className="font-medium">Profissional:</span> {appointmentDetails.employeeName}
              </p>
              <p>
                <span className="font-medium">Serviços:</span>{" "}
                {appointmentDetails.services.map(s => s.name).join(", ")}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2"> {/* Usar flex-col para empilhar botões */}
            {whatsapp && (
              <Button asChild className="w-full bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircleMore className="mr-2 h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            )}
            {instagramUrl && ( // Renderizar botão do Instagram se o URL existir
              <Button asChild className="w-full bg-instagram hover:bg-instagram/90 text-instagram-foreground">
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Instagram className="mr-2 h-4 w-4" />
                  Nosso Instagram
                </a>
              </Button>
            )}
          </div>

          {address && (
            <p className="text-lg">
              Endereço: <span className="font-medium">{address}</span>
            </p>
          )}
          {!whatsapp && !instagramUrl && !address && (
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