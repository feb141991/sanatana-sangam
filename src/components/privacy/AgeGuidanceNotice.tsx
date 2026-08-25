import { ShieldCheck } from 'lucide-react';

import { AGE_GUIDANCE_POLICY, isUnderGuidanceAge } from '@/lib/compliance/age-guidance';

export function AgeGuidanceNotice({
  dateOfBirth = '',
  subject = 'self',
}: {
  dateOfBirth?: string;
  subject?: 'self' | 'family-member';
}) {
  const under18 = isUnderGuidanceAge(dateOfBirth);
  const body = subject === 'family-member'
    ? AGE_GUIDANCE_POLICY.notice.familyBody
    : under18
      ? AGE_GUIDANCE_POLICY.notice.under18Body
      : AGE_GUIDANCE_POLICY.notice.body;

  return (
    <aside
      aria-live={under18 ? 'polite' : 'off'}
      className="flex items-start gap-3 rounded-2xl border px-4 py-3"
      style={{
        background: 'rgba(197, 160, 89, 0.07)',
        borderColor: 'rgba(197, 160, 89, 0.22)',
      }}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(197, 160, 89, 0.13)', color: 'var(--premium-gold)' }}
      >
        <ShieldCheck size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold" style={{ color: 'var(--brand-primary-strong)' }}>
          {AGE_GUIDANCE_POLICY.notice.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
          {body}
        </p>
      </div>
    </aside>
  );
}
