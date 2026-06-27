'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SupportChatProps {
  onClose: () => void;
  initialMessage?: string;
}

export function SupportChat({ onClose, initialMessage }: SupportChatProps) {
  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    api: '/api/chat',
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      append({ role: 'user', content: initialMessage });
    }
  }, [initialMessage, append, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-xl flex flex-col z-50 animate-in slide-in-from-bottom-5">
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Support Assistant</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden bg-background">
        <div className="h-full overflow-y-auto p-3 space-y-3" ref={scrollRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="h-8 text-sm"
          />
          <Button type="submit" size="icon" className="h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
