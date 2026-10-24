import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security and privacy',
  description: 'How ClearClaim protects your data: consent-based sharing, record-level access control and tamper-evident record fingerprints.',
  alternates: { canonical: '/security' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
