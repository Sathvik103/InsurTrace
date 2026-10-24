import Link from 'next/link';
import { LegalPage } from '@/components/public/LegalPage';
import { BRAND } from '@/lib/brand';

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What we keep,"
      accent="and who sees it."
      intro="A plain-language notice, following the principles of India’s Digital Personal Data Protection Act, 2023."
      updated="October 2026"
      sections={[
        {
          id: 'what',
          title: 'What we store',
          body: (
            <>
              <p>Only what you enter or ask us to save:</p>
              <ul>
                <li>Your account: email address, name if you add one, and account type.</li>
                <li>Your vehicles: registration, make, model, year, and any policy details you add (IDV, No-Claim Bonus, deductible, renewal premium, policy number and dates).</li>
                <li>Claim checks you choose to save, with the figures used.</li>
                <li>Who you have shared a vehicle with, and when.</li>
              </ul>
              <p>PDFs you upload are read to pull out the figures and are not stored.</p>
            </>
          ),
        },
        {
          id: 'why',
          title: 'Why we use it',
          body: <p>To run your claim checks, keep your vehicle history, and show records to organisations you have chosen to share with. We don’t sell your data, share it with advertisers, or send it to insurers on your behalf.</p>,
        },
        {
          id: 'sharing',
          title: 'Sharing is your choice',
          body: <p>A workshop, insurer or surveyor sees a vehicle’s records only after you grant access, for a period you pick. You can see every active grant and revoke it at any time on the <Link href="/decision/consent" className="font-medium text-navy-950 underline underline-offset-2">Data &amp; privacy</Link> page. Grants and revocations are logged.</p>,
        },
        {
          id: 'ledger',
          title: 'Fingerprints on the ledger',
          body: <p>When a ledger is connected, a saved claim check is turned into a SHA-256 fingerprint and only that fingerprint is written to the ledger. Names, phone numbers and addresses are never written there. A fingerprint can’t be turned back into the record.</p>,
        },
        {
          id: 'where',
          title: 'Where it is kept',
          body: <p>Your data is stored with Supabase (database and sign-in). Our server runs on Render in Singapore and the website on Vercel. Access is limited to what each signed-in account is allowed to see.</p>,
        },
        {
          id: 'rights',
          title: 'Your rights',
          body: (
            <>
              <p>You can download everything we hold about you from Settings, correct your details at any time, and ask us to delete your account and data.</p>
              <p>For any privacy request, email <a href={`mailto:${BRAND.contactEmail}?subject=Privacy request`} className="font-medium text-navy-950 underline underline-offset-2">{BRAND.contactEmail}</a>.</p>
            </>
          ),
        },
      ]}
    />
  );
}
