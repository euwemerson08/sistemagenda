"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  // Adicione outros campos do funcionário se desejar exibi-los no cartão
}

interface EmployeeCardProps {
  employee: Employee;
  isSelected: boolean;
  onSelect: (employeeId: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, isSelected, onSelect }) => {
  return (
    <Card
      className={cn(
        "relative flex flex-col justify-between p-4 cursor-pointer transition-all duration-200",
        isSelected ? "border-primary ring-2 ring-primary" : "hover:border-gray-300 dark:hover:border-gray-700"
      )}
      onClick={() => onSelect(employee.id)}
    >
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-lg font-semibold">{employee.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Você pode adicionar mais detalhes do funcionário aqui, como email, telefone, etc. */}
        {isSelected && (
          <div className="absolute top-2 right-2 text-primary">
            <CheckCircle className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;