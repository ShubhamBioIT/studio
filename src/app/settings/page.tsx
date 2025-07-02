import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Application-wide settings and preferences will be available here soon.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
