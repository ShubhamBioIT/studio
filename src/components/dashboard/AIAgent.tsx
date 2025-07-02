'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { runAgent, Message } from '@/ai/flows/agentFlow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';

export default function AIAgent() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your intelligent lab partner. How can I help you create projects, add samples, or brainstorm ideas?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, firebaseUser } = useAuth();
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
        scrollAreaViewportRef.current.scrollTo({
        top: scrollAreaViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be signed in to use the AI assistant.',
        });
        return;
    }
    
    const newMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    const currentQuery = query;
    setQuery('');
    setIsLoading(true);

    try {
      const agentUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      };
      // Pass the history *before* the current user message
      const history = newMessages.slice(0, -1);
      const result = await runAgent(currentQuery, history, agentUser);
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (error) {
      console.error('AI Agent Error:', error);
      const errorMessage = 'Sorry, I ran into an error. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: 'There was a problem communicating with the AI.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-10rem)] max-h-[800px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4" ref={scrollAreaViewportRef}>
                {messages.map((message, index) => (
                <div
                    key={index}
                    className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' && 'justify-end'
                    )}
                >
                    {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 border">
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    )}
                    <div
                    className={cn(
                        'max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm whitespace-pre-wrap',
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                    >
                    {message.content}
                    </div>
                    {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={firebaseUser?.photoURL || ''} alt={user?.displayName || ''} />
                        <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                    )}
                </div>
                ))}
                {isLoading && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border"><AvatarFallback>AI</AvatarFallback></Avatar>
                    <div className="bg-muted rounded-lg p-3 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                )}
            </div>
        </ScrollArea>
      </CardContent>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me to do something..."
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? <span className="animate-spin">⚙️</span> : 'Send'}
          </Button>
        </form>
      </div>
    </Card>
  );
}
