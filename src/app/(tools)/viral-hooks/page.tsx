'use client';

import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Sparkles, Terminal, MessageSquare } from 'lucide-react';
import { experimental_useObject as useObject } from '@ai-sdk/react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OutputList } from '@/components/output-list';
import { SupportChat } from '@/components/support-chat';

const formSchema = z.object({
  topic: z.string().min(3, {
    message: 'Topic must be at least 3 characters.',
  }),
});

const HooksOutputSchema = z.object({
  hooks: z.array(z.string()),
});

export default function ViralHooksPage() {
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const { object, submit, isLoading, error: aiError, stop } = useObject({
    api: '/api/generate-viral-hooks',
    schema: HooksOutputSchema,
    onError: (error) => {
      setGenerationError(error.message || 'An error occurred during generation.');
    },
  });

  // Timeout logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        stop();
        setGenerationError("Generation timed out. The system is taking longer than expected.");
        setShowChat(true);
      }, 20000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, stop]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setGenerationError(null);
    setShowChat(false);
    submit(values);
  }

  const hooks = object?.hooks || [];
  // Ensure we have an array of strings, filtering out undefineds if partial parsing happens oddly
  const validHooks = hooks.filter((h): h is string => typeof h === 'string');

  return (
    <div>
      <PageHeader
        title="Viral Hook Generator"
        description="Enter a topic and get attention-grabbing hooks for your reels."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 'morning routines', 'productivity hacks'" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Hooks
              </>
            )}
          </Button>
        </form>
      </Form>

      {(aiError || generationError) && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{generationError || 'An error occurred while generating hooks. Please try again.'}</p>
            {showChat && (
                <Button variant="outline" size="sm" className="w-fit" onClick={() => setShowChat(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat with Support
                </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <OutputList items={validHooks} isLoading={isLoading} count={5} />

      {showChat && (
        <SupportChat
            onClose={() => setShowChat(false)}
            initialMessage="I'm having trouble generating viral hooks. It timed out."
        />
      )}
    </div>
  );
}
