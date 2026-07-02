import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'Contact | Shoonaya',
  description: 'Contact and support information for Shoonaya.',
};

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? '';
  const isConfigured = Boolean(supportEmail);

  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Support should be easy to find."
      intro={
        isConfigured
          ? 'If you need help with your account, a safety issue, or a product question, you can reach the team through the support address on this page.'
          : 'If you need help with your account, a safety issue, or a product question, this is where support information should live. Before public launch, the production support email should be configured here.'
      }
      asideTitle={isConfigured ? 'Support Is Live' : 'Configuration Needed'}
      asideBody={
        isConfigured
          ? 'This page now exposes the public support route for account help, moderation concerns, and launch questions.'
          : 'Set NEXT_PUBLIC_SUPPORT_EMAIL in the environment to publish the support address on this page before launch.'
      }
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">General Support</h2>
        {supportEmail ? (
          <p>
            Reach the team at{' '}
            <a className="text-[#7B1A1A] font-semibold hover:underline" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
            {' '}for account help, access issues, or general questions.
          </p>
        ) : (
          <p>
            Support email is not configured yet. Before launch, add <code>NEXT_PUBLIC_SUPPORT_EMAIL</code>
            {' '}to the environment so users have a real support path.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Safety And Moderation</h2>
        <p>
          Safety concerns, abuse, impersonation, and harmful content should be routed through a dedicated
          support and moderation workflow. This page is the public destination for those requests until
          in-app reporting is fully implemented.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Partnerships</h2>
        <p>
          Temple organizers, satsang leaders, and community builders should also be able to use this page
          to reach the team for early partnerships and pilot programs.
        </p>
      </section>
    </PublicPageShell>
  );
}
