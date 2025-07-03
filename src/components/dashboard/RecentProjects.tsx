import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import type { Project } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function RecentProjects({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Most recently created projects.</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{project.name}</p>
                  {project.createdAt && (
                    <p className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(project.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No projects found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" className="w-full">
          <Link href="/projects">
            View All Projects <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
