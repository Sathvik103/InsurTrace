/**
 * Single source of truth for the product's identity. Renaming the product means
 * changing these values (plus copy that mentions the name in running text).
 */
export const BRAND = {
  name: 'ClearClaim',
  tagline: 'Know if a car insurance claim is worth it',
  descriptor: 'Claim decisions for car owners, fleets and workshops in India',
  description:
    'ClearClaim tells Indian car owners, fleets and workshops whether an insurance claim is worth it: what the insurer might pay, what you pay, and how your No-Claim Bonus is affected, line by line.',
  contactEmail: 'sathvikkandukuri202@gmail.com',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'https://insur-trace.vercel.app').replace(/\/$/, ''),
  assistantName: 'ClearClaim Assistant',
} as const;
