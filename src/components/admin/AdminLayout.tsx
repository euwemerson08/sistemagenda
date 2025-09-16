"use client";

import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react"; // Importar LogOut icon
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client"; // Importar supabase client
import { toast } from "sonner";

const AdminLayout: React.FC = () => {
  const isMobile = useIsMobile();

  const navLinks = [
    { name: "Dashboard", path: "/admin" },
    { name: "Agendamentos", path: "/admin/appointments" },
    { name: "Serviços", path: "/admin/services" },
    { name: "Horários de Funcionamento", path: "/admin/operating-hours" },
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
        {navLinks.map((link) => (
          <Button key={link.name} variant="ghost" className="justify-start" asChild>
            <Link to={link.path}>{link.name}</Link>
          </Button>
        ))}
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-xl font-semibold">Administração</h1>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;