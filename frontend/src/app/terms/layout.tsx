import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The terms for using ClearClaim.',
  alternates: { canonical: '/terms' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
