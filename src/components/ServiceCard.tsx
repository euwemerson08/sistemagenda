"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string;
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
        "flex flex-col justify-between p-4 cursor-pointer transition-all duration-200",
        isSelected ? "border-primary ring-2 ring-primary" : "hover:border-gray-300 dark:hover:border-gray-700"
      )}
      onClick={() => onSelect(service.id, !isSelected)}
    >
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(service.id, checked === true)}
            className="h-5 w-5"
          />
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-lg font-semibold text-primary">
          R$ {service.price.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;