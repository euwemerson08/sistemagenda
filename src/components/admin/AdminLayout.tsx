"use client";

import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Clock,
  PlusCircle,
  Settings, // Adicionado
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminLayout: React.FC = () => {
  const isMobile = useIsMobile();

  const navLinks = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Agendamentos", path: "/admin/appointments", icon: CalendarDays },
    { name: "Novo Agendamento", path: "/admin/new-appointment", icon: PlusCircle },
    { name: "Serviços", path: "/admin/services", icon: ClipboardList },
    { name: "Funcionários", path: "/admin/employees", icon: Users },
    { name: "Horários", path: "/admin/operating-hours", icon: Clock },
    { name: "Configurações", path: "/admin/settings", icon: Settings }, // Adicionado
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout: " + error.message);
    } else {
      toast.success("Logout realizado com sucesso!");
    }
  };

  const SidebarContent = (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-2xl font-bold mb-6 text-primary">Painel Admin</h2>
      <nav className="flex flex-col space-y-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Button key={link.name} variant="ghost" className="justify-start" asChild>
              <Link to={link.path}>
                <Icon className="mr-2 h-4 w-4" />
                {link.name}
              </Link>
            </Button>
          );
        })}
      </nav>
      <Separator className="my-4" />
      <Button variant="outline" className="mt-auto" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" /> Sair
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            {SidebarContent}
          </SheetContent>
        </Sheet>
      ) : (
        <aside className="hidden lg:flex w-64 flex-col border-r bg-background">
          {SidebarContent}
        </aside>
      )}
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-center gap-4 border-b bg-background px-4 md:static md:h-auto md:border-0 md:bg-transparent md:px-6">
          <h1 className="text-xl font-semibold">Administração</h1>
        </header>
        <main className="flex-1 p-4 pt-8 md:px-6 md:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;