import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Beaker } from 'lucide-react';

export default function SamplesPage() {
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker />
            Samples
          </CardTitle>
          <CardDescription>
            This page is under construction. Please check back later for sample management features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
            <p className="text-muted-foreground">Sample management content will be here.</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
