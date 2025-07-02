import { SignupForm } from "@/components/auth/SignupForm";
import Logo from "@/components/auth/Logo";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <Logo />
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                Create your LabLink account
            </h1>
            <p className="mt-2 text-muted-foreground">
                Get started with intelligent sample management.
            </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
