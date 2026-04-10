import type { ReactNode } from 'react';
import Card from './Card';

export default function MetricCard({
  label,
  value,
  meta,
  valueClassName = '',
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card className="p-3.5">
      <p className="text-[11px] text-[color:var(--text-tertiary)]">{label}</p>
      <div className={`mt-2 text-[22px] font-medium ${valueClassName}`}>{value}</div>
      {meta ? <div className="mt-1 text-[10px] text-[color:var(--text-tertiary)]">{meta}</div> : null}
    </Card>
  );
}
