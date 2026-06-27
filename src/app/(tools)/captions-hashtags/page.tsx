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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  themeOrMessage: z.string().min(10, 'Please provide more details on the theme or message.'),
});

const OutputSchema = z.object({
  captions: z.array(z.string()),
  hashtags: z.array(z.string()),
});

export default function CaptionsHashtagsPage() {
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { object, submit, isLoading, error: aiError } = useObject({
    api: '/api/generate-captions-hashtags',
    schema: OutputSchema,
    onError: (error) => {
      setGenerationError(error.message || 'An error occurred during generation.');
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      themeOrMessage: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setGenerationError(null);
    submit(values);
  }

  const captions = object?.captions?.filter((c): c is string => typeof c === 'string') || [];
  const hashtags = object?.hashtags?.filter((h): h is string => typeof h === 'string') || [];

  const hasContent = captions.length > 0 || hashtags.length > 0 || isLoading;

  return (
    <div>
      <PageHeader
        title="Caption and Hashtag AI"
        description="Generate emotion-based captions and trending hashtags for your content."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="themeOrMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme or Message</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the theme, message, or content of your reel..." {...field} rows={4} />
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
                Generate Content
              </>
            )}
          </Button>
        </form>
      </Form>

      {(aiError || generationError) && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generationError || 'An error occurred while generating content.'}</AlertDescription>
        </Alert>
      )}

      {hasContent && (
        <Card className="mt-6">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Captions</h3>
              <OutputList items={captions} isLoading={isLoading} count={3} />
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Hashtags</h3>
              <OutputList items={hashtags} isLoading={isLoading} count={5} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
