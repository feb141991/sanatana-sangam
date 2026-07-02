import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export function AsyncStateCard({
  state,
  title,
  description,
  icon,
  className,
}: {
  state: 'loading' | 'error' | 'empty';
  title: string;
  description: string;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={cn('surface-soft-card rounded-[1.6rem] px-5 py-6 text-center', className)}>
      <div className="flex justify-center">
        {state === 'loading' ? (
          <Spinner className="h-6 w-6" />
        ) : state === 'error' ? (
          <AlertCircle className="h-6 w-6 theme-dim" />
        ) : (
          <span className="text-2xl">{icon ?? '•'}</span>
        )}
      </div>
      <h3 className="mt-3 type-card-heading">{title}</h3>
      <p className="mt-2 type-body">{description}</p>
    </div>
  );
}
