'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Sparkles, Terminal } from 'lucide-react';
import { experimental_useObject as useObject } from '@ai-sdk/react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OutputText } from '@/components/output-text';

const styles = [
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'calm', label: 'Calm' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'authoritative', label: 'Authoritative' },
] as const;


const formSchema = z.object({
  content: z.string().min(10, 'Please enter some content to rewrite.'),
  style: z.enum(styles.map(s => s.value) as [string, ...string[]]),
});

const OutputSchema = z.object({
  rewrittenContent: z.string(),
});

export default function RewriteToolPage() {
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { object, submit, isLoading, error: aiError } = useObject({
    api: '/api/rewrite-content',
    schema: OutputSchema,
    onError: (error) => {
      setGenerationError(error.message || 'An error occurred during generation.');
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      style: 'storytelling',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setGenerationError(null);
    submit(values);
  }

  const rewrittenContent = object?.rewrittenContent || '';

  return (
    <div>
      <PageHeader
        title="Multi-Style Rewrite Tool"
        description="Rewrite your content in various tones to match your desired impact."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Content</FormLabel>
                <FormControl>
                  <Textarea placeholder="Paste your script, caption, or any text here..." {...field} rows={6} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Rewrite Style</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {styles.map(style => (
                      <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Rewrite Content
              </>
            )}
          </Button>
        </form>
      </Form>

      {(aiError || generationError) && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generationError || 'An error occurred while rewriting content.'}</AlertDescription>
        </Alert>
      )}

      <OutputText text={rewrittenContent} isLoading={isLoading} />
    </div>
  );
}
