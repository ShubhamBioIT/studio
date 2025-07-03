'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Card } from '@/components/ui/card';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});


export function LoginForm() {
  const { signInWithEmail, signInAsGuest, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmail(values.email, values.password);
      toast({
        title: 'Success',
        description: "You've successfully signed in.",
      });
      router.push('/');
    } catch (error: any) {
      let description = error.message || 'An unexpected error occurred.';
      if (error.code === 'auth/operation-not-allowed') {
        description = 'Email/Password sign-in is not enabled. Please enable it in the Firebase Authentication console under Sign-in method.'
      }
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  async function handleGuestSignIn() {
    setIsGuestLoading(true);
    try {
        await signInAsGuest();
        toast({
          title: 'Success',
          description: "You've successfully signed in as a guest.",
        });
        router.push('/');
    } catch (error: any) {
        let description = error.message || 'Could not sign in as guest. Please try again.';
         if (error.code === 'auth/operation-not-allowed') {
            description = 'Anonymous sign-in is not enabled for this project. Please go to your Firebase Console, open Authentication -> Sign-in method, and enable the Anonymous provider.';
        }
        toast({
            variant: 'destructive',
            title: 'Guest Sign-In Failed',
            description,
        });
    } finally {
        setIsGuestLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
        {!isFirebaseConfigured && (
            <Alert variant="destructive" className="mb-6">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Firebase Configuration Error</AlertTitle>
                <AlertDescription>
                    Sign in is disabled. Please configure your Firebase credentials in <code>.env.local</code>.
                </AlertDescription>
            </Alert>
        )}
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                        <Input placeholder="name@example.com" {...field} disabled={!isFirebaseConfigured} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseConfigured} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !isFirebaseConfigured}>
              {isLoading && <span className="animate-spin mr-2">⚙️</span>}
              Sign In
            </Button>
        </form>
        </Form>
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Or
                </span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGuestSignIn} disabled={isGuestLoading || !isFirebaseConfigured}>
            {isGuestLoading ? <span className="animate-spin mr-2">⚙️</span> : null}
            Sign in as Guest
        </Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
            </Link>
        </p>
    </Card>
  );
}
