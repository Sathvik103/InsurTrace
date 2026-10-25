import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How ClearClaim works inside',
  description: 'The system behind ClearClaim: architecture, request flows, stack, data model, trade-offs and how it scales.',
  alternates: { canonical: '/system' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
