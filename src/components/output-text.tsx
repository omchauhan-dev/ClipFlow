import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Skeleton } from '@/components/ui/skeleton';

interface OutputTextProps {
  text: string;
  isLoading?: boolean;
}
export function OutputText({ text, isLoading }: OutputTextProps) {
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  if (!text) return null;

  return (
    <Card className="mt-6 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-end py-2 pr-2">
        <CopyButton textToCopy={text} />
      </CardHeader>
      <CardContent className="pt-0">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
}
