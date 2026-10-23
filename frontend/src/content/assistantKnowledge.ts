/**
 * Curated knowledge base for the VeriSure Assistant.
 *
 * General explanations of Indian private-car insurance concepts written for
 * non-experts. They describe common practice, not any specific policy: the
 * user's own policy wording and insurer always take precedence. Reviewed
 * against public IRDAI consumer material (policyholder.gov.in) and the India
 * Motor Tariff schedules that insurers commonly still follow.
 */

export interface KnowledgeLink {
  label: string;
  href: string;
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  /** Words and phrases people actually type. */
  keywords: string[];
  answer: string[];
  links?: KnowledgeLink[];
  followUps?: string[];
  topic: 'basics' | 'claims' | 'money' | 'verisure' | 'privacy';
}

export const LAST_REVIEWED = 'October 2026';

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'idv',
    topic: 'basics',
    question: 'What is IDV?',
    keywords: ['idv', 'insured declared value', 'declared value', 'sum insured', 'car value', 'maximum payout', 'market value'],
    answer: [
      'IDV (Insured Declared Value) is the most your insurer will pay in a year. It is usually what you would get if the car were stolen or damaged beyond repair.',
      'It is roughly the showroom price minus depreciation for age. A commonly used schedule is 5% off for under 6 months, 15% up to 1 year, 20% up to 2 years, 30% up to 3, 40% up to 4 and 50% up to 5 years. Older cars have an IDV agreed with the insurer.',
      'A higher IDV means a higher premium but a bigger payout for a total loss. You can find your IDV on the first page of your policy schedule.',
    ],
    followUps: ['What happens if my car is a total loss?', 'How does depreciation reduce my claim?'],
  },
  {
    id: 'ncb',
    topic: 'money',
    question: 'How does No-Claim Bonus (NCB) work?',
    keywords: ['ncb', 'no claim bonus', 'no-claim bonus', 'no claim discount', 'bonus', 'discount', 'claim free', 'lose ncb', 'ncb reset'],
    answer: [
      'NCB is a discount on the own-damage part of your premium, earned for every year you do not make a claim. The usual steps are 20% after 1 claim-free year, then 25%, 35%, 45% and a maximum of 50% after 5 years.',
      'If you make a claim, the NCB usually drops to 0% at your next renewal. Losing a 35–50% discount can cost more than a small repair, which is why VeriSure compares claiming with paying yourself.',
      'NCB belongs to you, not the car. You can usually carry it to a new car or a new insurer. Third-party premium is not discounted by NCB.',
    ],
    followUps: ['Should I claim or pay myself?', 'What is NCB protection?'],
  },
  {
    id: 'ncb-protect',
    topic: 'money',
    question: 'What is NCB protection?',
    keywords: ['ncb protection', 'ncb protect', 'protect ncb', 'ncb add-on', 'keep ncb'],
    answer: [
      'NCB protection is an optional add-on. It lets you make a limited number of claims (often one per year) without losing your No-Claim Bonus.',
      'If you have it, claiming usually costs you much less in future premiums. Check your policy schedule for “NCB Protect” or similar. Terms differ between insurers.',
    ],
    followUps: ['How does No-Claim Bonus (NCB) work?'],
  },
  {
    id: 'deductible',
    topic: 'money',
    question: 'What is a deductible?',
    keywords: ['deductible', 'excess', 'compulsory deductible', 'voluntary deductible', 'compulsory excess', 'pay first'],
    answer: [
      'The deductible (or “excess”) is the part of every own-damage claim that you always pay yourself.',
      'The compulsory deductible commonly applied to private cars is ₹1,000 for engines up to 1,500cc and ₹2,000 above 1,500cc.',
      'A voluntary deductible is an extra amount you agree to pay in exchange for a lower premium. Both are added together when a claim is settled. Your policy schedule lists the exact amounts.',
    ],
    followUps: ['How was my estimated payout calculated?'],
  },
  {
    id: 'depreciation',
    topic: 'money',
    question: 'How does depreciation reduce my claim?',
    keywords: ['depreciation', 'dep', 'parts depreciation', 'why less', 'deduction', 'plastic', 'metal', 'rubber', 'glass', 'fibre', 'fiberglass'],
    answer: [
      'For replaced parts, insurers usually pay less than the new-part price, depending on the material and the car’s age.',
      'Commonly applied rates: rubber, nylon and plastic parts, and batteries, 50%. Fibreglass 30%. Glass 0%.',
      'Metal parts by car age: nil up to 6 months, 5% up to 1 year, 10% up to 2, 15% up to 3, 25% up to 4, 35% up to 5, 40% up to 10 years and 50% after that.',
      'Labour is not depreciated. A zero-depreciation add-on removes most of these deductions.',
    ],
    followUps: ['What is zero depreciation cover?', 'How was my estimated payout calculated?'],
  },
  {
    id: 'zero-dep',
    topic: 'basics',
    question: 'What is zero depreciation cover?',
    keywords: ['zero dep', 'zero depreciation', 'nil dep', 'nil depreciation', 'bumper to bumper', 'bumper-to-bumper'],
    answer: [
      'Zero-depreciation (also called “nil dep” or “bumper-to-bumper”) is an add-on. With it, the insurer pays for replaced parts without deducting depreciation.',
      'It usually still excludes consumables like oil, nuts and bolts, and it often limits how many claims per year qualify. It is most valuable for newer cars with costly plastic and fibre parts.',
    ],
    followUps: ['How does depreciation reduce my claim?'],
  },
  {
    id: 'claim-or-pay',
    topic: 'money',
    question: 'Should I claim or pay myself?',
    keywords: ['should i claim', 'claim or pay', 'pay myself', 'self pay', 'out of pocket', 'worth claiming', 'small repair', 'is it worth'],
    answer: [
      'Claiming makes sense when the insurer’s payout is clearly larger than what claiming costs you. That cost is your deductible, the depreciation you pay, and the No-Claim Bonus discount you lose at renewal.',
      'For small repairs, losing a 35–50% NCB often costs more than the repair itself, so paying yourself can be cheaper.',
      'VeriSure’s claim check works this out with your own numbers and shows every step. Open it from “Check a claim”.',
    ],
    links: [{ label: 'Check a claim', href: '/decision' }],
    followUps: ['How does No-Claim Bonus (NCB) work?', 'How was my estimated payout calculated?'],
  },
  {
    id: 'payout-calc',
    topic: 'money',
    question: 'How was my estimated payout calculated?',
    keywords: ['how calculated', 'calculation', 'estimated payout', 'payout', 'how much will insurer pay', 'insurer pay', 'formula', 'breakdown'],
    answer: [
      'VeriSure starts from your total repair bill. It subtracts depreciation on the parts (based on material and car age, unless you have zero-dep), then your deductible, and caps the result at your IDV.',
      'That gives the estimated insurer payout. Your out-of-pocket cost is the bill minus that payout.',
      'It then adds the No-Claim Bonus discount you would lose next year to compare claiming with paying yourself. These are fixed published rules, not AI guesses. The final settlement is always decided by your insurer and surveyor.',
    ],
    followUps: ['How does depreciation reduce my claim?', 'Is this the amount my insurer will pay?'],
  },
  {
    id: 'not-final',
    topic: 'verisure',
    question: 'Is this the amount my insurer will pay?',
    keywords: ['trust', 'reliable', 'exact', 'guaranteed', 'final amount', 'will insurer pay', 'accurate', 'approve', 'approval', 'reject', 'settlement'],
    answer: [
      'No. VeriSure gives an estimate using standard rules so that you can decide what to do. It does not approve or reject claims and is not connected to any insurer.',
      'Your insurer’s surveyor inspects the damage and settles the claim under your exact policy wording. Actual amounts can differ, for example because of add-ons, policy exclusions or the surveyor’s assessment of parts.',
    ],
    followUps: ['What does a surveyor do?'],
  },
  {
    id: 'documents',
    topic: 'claims',
    question: 'What documents do I need for a claim?',
    keywords: ['documents', 'papers', 'what do i need', 'required documents', 'fir', 'rc', 'driving licence', 'license', 'claim form', 'kyc'],
    answer: [
      'Insurers commonly ask for:',
      '• the claim form and a copy of the policy\n• the vehicle RC (registration certificate)\n• the driving licence of the person driving\n• the workshop repair estimate and photos of the damage\n• KYC details',
      'An FIR is usually needed for theft, a major accident, or when a third party is injured or their property is damaged. Check your insurer’s list, because requirements vary.',
    ],
    followUps: ['Cashless or reimbursement claim: what’s the difference?', 'How do I start a claim?'],
  },
  {
    id: 'start-claim',
    topic: 'claims',
    question: 'How do I start a claim?',
    keywords: ['start claim', 'file claim', 'raise claim', 'register claim', 'how to claim', 'claim process', 'intimate', 'inform insurer'],
    answer: [
      '1. Inform your insurer as soon as possible through their app, website or helpline. Most policies set a time limit.',
      '2. Take photos and do not repair the car before the insurer allows it.',
      '3. A surveyor inspects the damage.',
      '4. The workshop repairs the car. In a cashless claim the insurer pays the workshop directly; otherwise you pay and get reimbursed.',
      'VeriSure does not file claims for you. Use it beforehand to check whether claiming is worth it.',
    ],
    followUps: ['What documents do I need for a claim?', 'Should I claim or pay myself?'],
  },
  {
    id: 'cashless',
    topic: 'claims',
    question: 'Cashless or reimbursement claim: what’s the difference?',
    keywords: ['cashless', 'reimbursement', 'network garage', 'network workshop', 'pay later', 'garage'],
    answer: [
      'Cashless: you repair at one of the insurer’s network workshops, and the insurer pays the workshop directly. You pay only your share (deductible, depreciation, anything not covered).',
      'Reimbursement: you repair at any workshop, pay the full bill, then submit bills to the insurer for repayment. That takes longer.',
    ],
    followUps: ['How do I start a claim?'],
  },
  {
    id: 'surveyor',
    topic: 'claims',
    question: 'What does a surveyor do?',
    keywords: ['surveyor', 'loss assessor', 'inspection', 'assessor', 'survey'],
    answer: [
      'A surveyor (loss assessor) is a licensed professional appointed by the insurer. They inspect the damage, decide which parts need repair or replacement, and assess the claim amount.',
      'Their report is a key input to what the insurer finally pays.',
    ],
  },
  {
    id: 'total-loss',
    topic: 'claims',
    question: 'What happens if my car is a total loss?',
    keywords: ['total loss', 'totaled', 'write off', 'written off', 'beyond repair', 'stolen', 'theft', 'constructive total loss'],
    answer: [
      'If the car is stolen, or the repair cost is too high compared with its value, the insurer may treat it as a total loss and pay up to the IDV, minus your deductible.',
      'Many policies treat repairs above about 75% of the IDV as a “constructive total loss”. Your policy wording sets the exact rule.',
    ],
    followUps: ['What is IDV?'],
  },
  {
    id: 'third-party',
    topic: 'basics',
    question: 'What is third-party vs own-damage cover?',
    keywords: ['third party', 'third-party', 'own damage', 'od', 'tp', 'comprehensive', 'mandatory', 'liability'],
    answer: [
      'Third-party cover pays for injury or damage you cause to other people or their property. It is mandatory by law in India.',
      'Own-damage cover pays for damage to your own car. A comprehensive policy includes both.',
      'NCB, deductible and depreciation apply to own-damage claims. VeriSure’s claim check is about own-damage repairs.',
    ],
  },
  {
    id: 'premium-next-year',
    topic: 'money',
    question: 'What should I enter as next year’s premium?',
    keywords: ['premium', 'next year premium', 'renewal', 'base premium', 'how much premium', 'own damage premium'],
    answer: [
      'Use the own-damage premium before NCB from your current policy schedule, or a recent renewal quote. That is the amount the NCB discount is taken from.',
      'If you are not sure, your total premium is a reasonable starting point, but the estimate will be less precise. VeriSure does not look this up for you.',
    ],
  },
  {
    id: 'ledger',
    topic: 'verisure',
    question: 'What does blockchain verification mean?',
    keywords: ['blockchain', 'ledger', 'fabric', 'hyperledger', 'verified', 'verification', 'tamper', 'fingerprint', 'hash', 'anchored', 'transaction'],
    answer: [
      'When you save a claim record, VeriSure creates a SHA-256 “fingerprint” of it and anchors that fingerprint on a Hyperledger Fabric ledger. Later, anyone you share the record with can check that it has not been changed since it was saved.',
      'It proves the record is unchanged. It does not prove that the accident or damage really happened; that is for your insurer and surveyor to assess. The ledger is a private development network, not a public blockchain.',
    ],
    links: [{ label: 'Verify a record', href: '/verification' }],
    followUps: ['Why is the ledger not connected?'],
  },
  {
    id: 'ledger-offline',
    topic: 'verisure',
    question: 'Why is the ledger not connected?',
    keywords: ['ledger offline', 'not connected', 'pending', 'anchoring pending', 'ledger unavailable', 'why pending', 'retry'],
    answer: [
      'The integrity ledger runs on separate infrastructure. When it is not reachable from this deployment, VeriSure still saves your record and marks its fingerprint as “pending”. You can use “Retry anchoring” later.',
      'Your financial estimate is not affected. The status page shows the current state of every component.',
    ],
    links: [{ label: 'System status', href: '/settings?tab=status' }],
  },
  {
    id: 'what-is-verisure',
    topic: 'verisure',
    question: 'What is VeriSure and who is it for?',
    keywords: ['what is verisure', 'about', 'who are you', 'what can you do', 'help', 'what does this do', 'verisure'],
    answer: [
      'VeriSure helps car owners in India understand their motor insurance before they act. It estimates what your insurer might pay, what you would pay, and whether claiming or paying yourself is cheaper over the next few years.',
      'It also keeps a tamper-evident history of your vehicle’s records. It is independent: it is not an insurer, not an IRDAI service, and not connected to VAHAN or insurer systems.',
    ],
    followUps: ['Should I claim or pay myself?', 'What does blockchain verification mean?'],
  },
  {
    id: 'demo',
    topic: 'verisure',
    question: 'What are “demo records”?',
    keywords: ['demo', 'sample', 'fake', 'example', 'demo record', 'sandbox', 'test data'],
    answer: [
      'Records labelled “Demo” are fictional sample vehicles and policies, there to let you explore VeriSure. They are not real customers and not insurer data, even when they use real insurer names for realism.',
      'Add your own vehicle to see estimates for your car.',
    ],
    links: [{ label: 'Add my vehicle', href: '/onboarding' }],
  },
  {
    id: 'upload-policy',
    topic: 'verisure',
    question: 'How does policy upload work?',
    keywords: ['upload', 'pdf', 'extract', 'scan', 'policy document', 'estimate pdf', 'read my policy', 'document'],
    answer: [
      'You can upload a text-based PDF of your policy schedule or a workshop estimate. VeriSure reads fields such as IDV, NCB, deductible and repair totals using fixed rules (not AI), and shows them for you to check and correct before they are used.',
      'Scanned images without text cannot be read yet. Extracted values are labelled “Document extracted” so you always know where a number came from.',
    ],
    links: [{ label: 'Upload a document', href: '/decision/extract' }],
  },
  {
    id: 'privacy',
    topic: 'privacy',
    question: 'Who can see my vehicle data?',
    keywords: ['privacy', 'data', 'who can see', 'share', 'consent', 'revoke', 'dpdp', 'personal data', 'delete'],
    answer: [
      'Only you, unless you grant access. You can give a workshop, insurer or assessor time-limited access (30, 60 or 90 days) to a vehicle’s records and revoke it at any time from Data & Privacy.',
      'VeriSure follows DPDP-aligned principles of consent and data minimisation. The assistant does not send your data anywhere: it answers from this guide and from what is on your screen.',
    ],
    links: [{ label: 'Data & Privacy', href: '/decision/consent' }],
  },
  {
    id: 'ai-scores',
    topic: 'verisure',
    question: 'Does VeriSure use AI to score my claim?',
    keywords: ['ai', 'machine learning', 'ml', 'fraud score', 'fraud', 'severity', 'model', 'damage detection', 'photo analysis'],
    answer: [
      'Not for money. All payout figures come from fixed, published rules that you can inspect step by step.',
      'Machine-learning features such as fraud or severity scores are switched off, because VeriSure does not have access to a validated claims dataset. Showing made-up scores would be misleading.',
    ],
  },
];

export const STARTER_QUESTIONS = [
  'Should I claim or pay myself?',
  'How does No-Claim Bonus (NCB) work?',
  'What is IDV?',
  'What documents do I need for a claim?',
];
