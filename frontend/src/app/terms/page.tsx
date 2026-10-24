import { LegalPage } from '@/components/public/LegalPage';
import { BRAND } from '@/lib/brand';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="The terms,"
      accent="in plain words."
      intro="By using ClearClaim you agree to these terms. They are short on purpose."
      updated="October 2026"
      sections={[
        {
          id: 'service',
          title: 'What ClearClaim is',
          body: <p>A tool that estimates what an insurer might pay on a car repair, what you would pay, and which option costs less. It also reads policy and estimate PDFs, keeps a history of your vehicles, and lets you share records. It does not sell insurance, file claims or decide them.</p>,
        },
        {
          id: 'estimates',
          title: 'Estimates are estimates',
          body: <p>Figures come from the information you enter and standard motor-insurance rules. Your policy wording, add-ons and the insurer’s surveyor decide the actual settlement. Don’t treat a result as a promise of payment.</p>,
        },
        {
          id: 'you',
          title: 'What we ask of you',
          body: (
            <ul>
              <li>Enter information that is true to the best of your knowledge.</li>
              <li>Upload only documents you are allowed to share.</li>
              <li>Don’t use ClearClaim to support a false or inflated claim, or to access records that aren’t yours.</li>
            </ul>
          ),
        },
        {
          id: 'records',
          title: 'Saved records and the ledger',
          body: <p>A ledger fingerprint shows that a saved record has not changed since it was saved. It does not prove that what the record describes actually happened. You can still correct or delete your records; the old fingerprint then simply stops matching.</p>,
        },
        {
          id: 'availability',
          title: 'Availability',
          body: <p>ClearClaim is provided as it is. We work to keep it running and accurate, but the server can be slow to wake up and features can change. We may suspend accounts that misuse the service.</p>,
        },
        {
          id: 'contact',
          title: 'Contact',
          body: <p>Questions about these terms: <a href={`mailto:${BRAND.contactEmail}`} className="font-medium text-navy-950 underline underline-offset-2">{BRAND.contactEmail}</a>.</p>,
        },
      ]}
    />
  );
}
