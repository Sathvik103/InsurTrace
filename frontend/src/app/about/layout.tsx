import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About ClearClaim',
  description: 'Why ClearClaim exists: clear, independent answers on Indian car insurance claims, using standard rules and showing every step.',
  alternates: { canonical: '/about' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
