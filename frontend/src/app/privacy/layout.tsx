import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy notice',
  description: 'What data ClearClaim stores, why, and how you control who sees it.',
  alternates: { canonical: '/privacy' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
