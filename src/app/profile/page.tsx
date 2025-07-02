import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Your profile settings and user information will be available here soon.</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
