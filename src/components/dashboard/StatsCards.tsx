import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, FileText, FlaskConical } from 'lucide-react';
import type { Sample, Project, Workflow } from '@/types';

interface StatsCardsProps {
  samples: Sample[];
  projects: Project[];
  workflows: Workflow[];
}

export default function StatsCards({ samples, projects, workflows }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
          <Beaker className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{samples.length}</div>
          <p className="text-xs text-muted-foreground">All registered samples</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projects.length}</div>
          <p className="text-xs text-muted-foreground">Active and archived projects</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{workflows.length}</div>
          <p className="text-xs text-muted-foreground">Defined analysis pipelines</p>
        </CardContent>
      </Card>
    </div>
  );
}
