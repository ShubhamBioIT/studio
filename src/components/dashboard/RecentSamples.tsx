import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Sample, SampleStatus } from '@/types';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const statusVariant: Record<SampleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    'in-progress': 'default',
    completed: 'secondary',
    failed: 'destructive',
}

const statusColor: Record<SampleStatus, string> = {
    pending: 'border-yellow-500 text-yellow-500',
    'in-progress': 'bg-blue-500 text-white',
    completed: 'bg-green-500 text-white',
    failed: 'bg-destructive text-destructive-foreground',
}

export default function RecentSamples({ samples }: { samples: Sample[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Samples</CardTitle>
        <CardDescription>The 5 most recently created samples.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sample ID</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samples.length > 0 ? (
              samples.map((sample) => (
                <TableRow key={sample.id}>
                  <TableCell className="font-medium">{sample.sample_id}</TableCell>
                  <TableCell>{sample.project_name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[sample.status]} className={`${statusColor[sample.status]} capitalize`}>
                      {sample.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No recent samples.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter>
        <Button asChild size="sm" className="w-full">
          <Link href="/samples">
            View All Samples <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
