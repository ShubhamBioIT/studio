'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UpdateProfileForm } from './UpdateProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';

export default function ProfileClient() {
  const { user, loading, firebaseUser } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

  if (loading) {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-64" />
                </div>
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Avatar className="h-24 w-24 text-3xl">
          <AvatarImage src={firebaseUser?.photoURL || ''} alt={user?.displayName || ''} />
          <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user?.displayName}</h1>
          <p className="text-lg text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>
              Change your display name. This name will be visible to other team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateProfileForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your password and account security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Password management features are coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
