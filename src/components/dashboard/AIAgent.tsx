'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { runAgent } from '@/ai/flows/agentFlow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

export default function AIAgent() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      const result = await runAgent(query);
      setResponse(result);
    } catch (error) {
      console.error('AI Agent Error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: 'There was a problem communicating with the AI. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Your intelligent lab partner. Ask me to create projects, add samples, or brainstorm ideas.
          Try: "Suggest some project ideas for transcriptomics." or "Create a new project called 'Alzheimer's Research'."
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What can I help you with today?"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <span className="animate-spin">⚙️</span> : 'Ask'}
          </Button>
        </form>
      </CardContent>
      {isLoading && (
        <CardFooter>
            <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </CardFooter>
      )}
      {response && !isLoading && (
        <CardFooter>
          <p className="text-sm text-foreground max-w-none">
            {response}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
