import { Dna } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="inline-flex items-center justify-center gap-2">
        <Dna className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">LabTrack AI</span>
    </Link>
  );
}
