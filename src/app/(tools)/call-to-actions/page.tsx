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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OutputList } from '@/components/output-list';

const formSchema = z.object({
  reelContent: z.string().min(10, 'Please provide more details on your reel content.'),
});

const CTAsOutputSchema = z.object({
  callToActions: z.array(z.string()),
});

export default function CallToActionsPage() {
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { object, submit, isLoading, error: aiError } = useObject({
    api: '/api/generate-call-to-actions',
    schema: CTAsOutputSchema,
    onError: (error) => {
      setGenerationError(error.message || 'An error occurred during generation.');
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reelContent: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setGenerationError(null);
    submit(values);
  }

  const ctas = object?.callToActions || [];
  const validCtas = ctas.filter((c): c is string => typeof c === 'string');

  return (
    <div>
      <PageHeader
        title="Call-to-Action Generator"
        description="Generate compelling calls to action (CTAs) for your reel content."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="reelContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reel Content</FormLabel>
                <FormControl>
                  <Textarea placeholder="Briefly describe your reel or paste the script here..." {...field} rows={4} />
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
                Generate CTAs
              </>
            )}
          </Button>
        </form>
      </Form>

      {(aiError || generationError) && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generationError || 'An error occurred while generating CTAs.'}</AlertDescription>
        </Alert>
      )}

      <OutputList items={validCtas} isLoading={isLoading} count={5} />
    </div>
  );
}
