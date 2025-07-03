import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConical, ArrowRight } from 'lucide-react';
import type { Workflow } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function RecentWorkflows({ workflows }: { workflows: Workflow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Workflows</CardTitle>
        <CardDescription>Most recently created workflows.</CardDescription>
      </CardHeader>
      <CardContent>
        {workflows.length > 0 ? (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center">
                <FlaskConical className="h-5 w-5 text-muted-foreground" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{workflow.name}</p>
                   {workflow.createdAt && (
                    <p className="text-sm text-muted-foreground">
                        Created {formatDistanceToNow(workflow.createdAt.toDate(), { addSuffix: true })}
                    </p>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workflows found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" className="w-full">
          <Link href="/workflows">
            View All Workflows <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
