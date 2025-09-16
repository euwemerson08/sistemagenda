"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface OperatingHour {
  id?: string;
  day_of_week: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const daysOfWeekOrder = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
];

const dayNames: { [key: string]: string } = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export default function OperatingHoursManagementPage() {
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperatingHours();
  }, []);

  const formatTimeForInput = (time: string | null): string | null => {
    if (!time) return null;
    // Extracts "HH:mm" from "HH:mm:ss" or other formats from the database
    return time.slice(0, 5);
  };

  const fetchOperatingHours = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("operating_hours").select("*");
    if (error) {
      toast.error("Erro ao carregar horários de funcionamento: " + error.message);
    } else {
      const fetchedHoursMap = new Map(data.map(oh => [oh.day_of_week, {
        ...oh,
        open_time: formatTimeForInput(oh.open_time),
        close_time: formatTimeForInput(oh.close_time),
      }]));
      const fullOperatingHours = daysOfWeekOrder.map(day => {
        const existing = fetchedHoursMap.get(day);
        return existing || { day_of_week: day, open_time: null, close_time: null, is_closed: true };
      });
      setOperatingHours(fullOperatingHours);
    }
    setLoading(false);
  };

  const handleInputChange = (
    day: string,
    field: keyof OperatingHour,
    value: string | boolean | null
  ) => {
    setOperatingHours((prevHours) =>
      prevHours.map((oh) =>
        oh.day_of_week === day ? { ...oh, [field]: value } : oh
      )
    );
  };

  const handleSaveOperatingHour = async (hour: OperatingHour) => {
    const dataToSave = { ...hour };

    if (dataToSave.is_closed) {
      dataToSave.open_time = null;
      dataToSave.close_time = null;
    } else {
      if (!dataToSave.open_time || !dataToSave.close_time) {
        toast.error(`Por favor, defina os horários de abertura e fechamento para ${dayNames[hour.day_of_week]}.`);
        return;
      }
    }

    const { id, ...upsertData } = dataToSave;

    const { error } = await supabase
      .from("operating_hours")
      .upsert(upsertData, { onConflict: "day_of_week" });

    if (error) {
      toast.error("Erro ao salvar horário: " + error.message);
    } else {
      toast.success(`Horário para ${dayNames[hour.day_of_week]} salvo com sucesso!`);
      fetchOperatingHours();
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando horários...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Horários de Funcionamento</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Dia da Semana</TableHead>
            <TableHead className="w-[120px]">Abre às</TableHead>
            <TableHead className="w-[120px]">Fecha às</TableHead>
            <TableHead className="w-[100px] text-center">Fechado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operatingHours.map((hour) => (
            <TableRow key={hour.day_of_week}>
              <TableCell className="font-medium">{dayNames[hour.day_of_week]}</TableCell>
              <TableCell>
                <Input
                  type="time"
                  value={hour.open_time || ""}
                  onChange={(e) => handleInputChange(hour.day_of_week, "open_time", e.target.value)}
                  disabled={hour.is_closed}
                  className="w-full"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="time"
                  value={hour.close_time || ""}
                  onChange={(e) => handleInputChange(hour.day_of_week, "close_time", e.target.value)}
                  disabled={hour.is_closed}
                  className="w-full"
                />
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={hour.is_closed}
                  onCheckedChange={(checked) => handleInputChange(hour.day_of_week, "is_closed", checked)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleSaveOperatingHour(hour)}>
                  <Save className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}