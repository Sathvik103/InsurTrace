import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'ClearClaim provides estimates from standard motor-insurance rules. It is not an insurer and does not decide claims.',
  alternates: { canonical: '/disclaimer' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
