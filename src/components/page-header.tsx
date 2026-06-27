import type { FC, ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const PageHeader: FC<PageHeaderProps> = ({ title, description, children }) => {
  return (
    <header className="mb-8 border-b pb-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
        {title}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">{description}</p>
      {children}
    </header>
  );
};
