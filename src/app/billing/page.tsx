import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Your billing information and subscription details will be available here soon.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
