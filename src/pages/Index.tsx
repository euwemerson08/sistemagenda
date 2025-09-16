import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-foreground">
      <div className="text-center p-4">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Seu Aplicativo</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Comece a construir seu projeto incrível aqui!
        </p>
        <Link to="/services">
          <Button size="lg" className="text-lg px-8 py-4">
            Selecionar Serviços
          </Button>
        </Link>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;