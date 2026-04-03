import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: {
    wrapper: 'h-8 w-8 rounded-2xl',
    shell: 'inset-[18%] rounded-xl',
    core: 'h-[20%] w-[20%]',
    dot: 'h-[16%] w-[16%]',
  },
  md: {
    wrapper: 'h-10 w-10 rounded-[1.15rem]',
    shell: 'inset-[18%] rounded-[0.95rem]',
    core: 'h-[20%] w-[20%]',
    dot: 'h-[16%] w-[16%]',
  },
  lg: {
    wrapper: 'h-14 w-14 rounded-[1.45rem]',
    shell: 'inset-[18%] rounded-[1.2rem]',
    core: 'h-[20%] w-[20%]',
    dot: 'h-[16%] w-[16%]',
  },
} as const;

export default function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  const classes = sizeClasses[size];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'brand-mark-pulse relative inline-flex items-center justify-center overflow-hidden border border-white/60 shadow-[0_18px_32px_rgba(108,56,36,0.2),inset_0_1px_0_rgba(255,255,255,0.28)]',
        classes.wrapper,
        className
      )}
      style={{ background: 'linear-gradient(145deg, rgba(108, 56, 36, 0.94), rgba(201, 124, 50, 0.86))' }}
    >
      <span className={cn('absolute border border-white/28 bg-white/10', classes.shell)} />
      <span className={cn('absolute rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.5)]', classes.core)} />
      <span className={cn('absolute left-[22%] top-[24%] rounded-full bg-[#eac48a]', classes.dot)} />
      <span className={cn('absolute right-[22%] top-[24%] rounded-full bg-[#fff0cf]', classes.dot)} />
      <span className={cn('absolute bottom-[22%] left-[24%] rounded-full bg-[#efd3b3]', classes.dot)} />
      <span className={cn('absolute bottom-[22%] right-[24%] rounded-full bg-[#fbeedd]', classes.dot)} />
    </span>
  );
}
