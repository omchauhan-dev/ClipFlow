import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Skeleton } from '@/components/ui/skeleton';

interface OutputListProps {
  items: string[];
  isLoading?: boolean;
  count?: number; 
}

export function OutputList({ items, isLoading, count = 3 }: OutputListProps) {
  // If we have no items and not loading, show nothing
  if ((!items || items.length === 0) && !isLoading) return null;

  // Calculate how many skeletons to show
  // If loading, show at least 1, or the difference between expected count and current items
  const skeletonsToShow = isLoading
    ? Math.max(1, count - (items?.length || 0))
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
      {items?.map((item, index) => (
        <Card key={index} className="flex items-center justify-between p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm mr-4 flex-1">{item}</p>
          <CopyButton textToCopy={item} />
        </Card>
      ))}
      {isLoading && Array.from({ length: skeletonsToShow }).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}
