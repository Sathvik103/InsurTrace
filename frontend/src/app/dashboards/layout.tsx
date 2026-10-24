import type { Metadata } from 'next';

// Signed-in area: never indexed by search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
