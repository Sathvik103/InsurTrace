import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How the calculations work',
  description: 'The deterministic rules behind ClearClaim: depreciation by material and age, deductibles, IDV and No-Claim Bonus.',
  alternates: { canonical: '/technology' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
