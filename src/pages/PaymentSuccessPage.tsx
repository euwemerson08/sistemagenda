import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const externalReference = searchParams.get('external_reference');
    const status = searchParams.get('status');

    if (externalReference && status === 'approved') {
      const updateAppointmentStatus = async () => {
        const { error } = await supabase
          .from('appointments')
          .update({ payment_status: 'paid' })
          .eq('id', externalReference);
        
        if (error) {
          toast.error('Houve um problema ao atualizar o status do seu agendamento.');
        }
      };
      updateAppointmentStatus();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Pagamento Aprovado!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Seu agendamento foi confirmado com sucesso. Obrigado!
          </p>
          <Button asChild>
            <Link to="/services">Agendar Novo Horário</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;