"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (serviceId: string, isSelected: boolean) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onSelect }) => {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between p-3 cursor-pointer transition-all duration-200 text-sm", // Reduzido padding e tamanho da fonte base
        isSelected ? "border-primary ring-2 ring-primary" : "hover:border-gray-300 dark:hover:border-gray-700"
      )}
      onClick={() => onSelect(service.id, !isSelected)}
    >
      <CardHeader className="p-0 pb-1"> {/* Reduzido padding */}
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{service.name}</CardTitle> {/* Reduzido tamanho da fonte */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(service.id, checked === true)}
            className="h-4 w-4" // Reduzido tamanho do checkbox
          />
        </div>
        <CardDescription className="text-xs text-muted-foreground"> {/* Reduzido tamanho da fonte */}
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-2"> {/* Adicionado pt-2 para espaçamento */}
        <p className="text-base font-bold text-primary"> {/* Reduzido tamanho da fonte */}
          R$ {service.price.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;