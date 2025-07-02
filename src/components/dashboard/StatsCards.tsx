import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Sample } from '@/types';
import { SAMPLE_STATUS } from '@/lib/constants';

interface StatsCardsProps {
  samples: Sample[];
}

export default function StatsCards({ samples }: StatsCardsProps) {
  const totalSamples = samples.length;
  const pendingSamples = samples.filter(s => s.status === SAMPLE_STATUS.PENDING).length;
  const completedSamples = samples.filter(s => s.status === SAMPLE_STATUS.COMPLETED).length;
  const failedSamples = samples.filter(s => s.status === SAMPLE_STATUS.FAILED).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
          <Beaker className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSamples}</div>
          <p className="text-xs text-muted-foreground">All registered samples</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingSamples}</div>
          <p className="text-xs text-muted-foreground">Samples awaiting processing</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedSamples}</div>
          <p className="text-xs text-muted-foreground">Successfully processed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{failedSamples}</div>
          <p className="text-xs text-muted-foreground">Processing failures</p>
        </CardContent>
      </Card>
    </div>
  );
}
