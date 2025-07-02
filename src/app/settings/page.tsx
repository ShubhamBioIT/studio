'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { Moon, Sun, Laptop, Settings as SettingsIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and application preferences.</p>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application to your preference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Label className="font-semibold">Theme</Label>
                <p className="text-sm text-muted-foreground">Select the color scheme for the application dashboard.</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="flex flex-col h-24 items-center justify-center gap-2 transition-all">
                    <Sun className="h-7 w-7" />
                    <span className="text-sm font-medium">Light</span>
                </Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="flex flex-col h-24 items-center justify-center gap-2 transition-all">
                    <Moon className="h-7 w-7" />
                    <span className="text-sm font-medium">Dark</span>
                </Button>
                <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} className="flex flex-col h-24 items-center justify-center gap-2 transition-all">
                    <Laptop className="h-7 w-7" />
                    <span className="text-sm font-medium">System</span>
                </Button>
             </div>
          </CardContent>
        </Card>
        
        {/* Placeholder for more settings */}
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account details.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Account management settings will be available here soon.</p>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
