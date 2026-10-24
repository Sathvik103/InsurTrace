import { LegalPage } from '@/components/public/LegalPage';

export default function DisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Disclaimer"
      title="What our numbers"
      accent="can and can’t tell you."
      intro="ClearClaim is a decision-support tool. It is not an insurer, broker or corporate agent registered with IRDAI, and it gives no insurance or financial advice."
      updated="October 2026"
      sections={[
        {
          id: 'estimates',
          title: 'Estimates, not settlements',
          body: <p>Results are calculated from the policy details and repair figures you enter, using the depreciation schedule commonly applied in Indian motor insurance (General Regulation 8 of the former India Motor Tariff), your deductible and your IDV. Your policy wording, endorsements and the surveyor’s findings can change the actual amount.</p>,
        },
        {
          id: 'ncb',
          title: 'No-Claim Bonus',
          body: <p>We assume the usual rule: a claim resets the No-Claim Bonus to 0% at renewal, unless you have an NCB-protection add-on. Check your own policy for how your insurer applies it.</p>,
        },
        {
          id: 'repair-or-sell',
          title: 'Repair or sell',
          body: <p>The repair-or-sell comparison uses the values you enter for the car after repair and any offer for it as it is. It is arithmetic, not a valuation. The 75%-of-IDV total-loss line is a common policy rule, not a universal one; your insurer decides whether a car is a total loss.</p>,
        },
        {
          id: 'documents',
          title: 'Reading documents',
          body: <p>Figures read from a PDF are suggestions. Each one is marked with where it came from, and you should check them before relying on the result. Scanned or photographed pages can’t be read yet.</p>,
        },
        {
          id: 'ledger',
          title: 'What the ledger proves',
          body: <p>An anchored fingerprint shows a saved record hasn’t changed since it was saved. It does not show that an accident, repair or inspection happened as described. The ledger used is a test network, and it may not be connected to the live service at a given time.</p>,
        },
      ]}
    />
  );
}
