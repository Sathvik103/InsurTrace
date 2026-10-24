import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { VehicleProvider } from "@/context/VehicleContext";
import { Toaster } from "sonner";
import { AssistantProvider } from "@/context/AssistantContext";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { BRAND } from "@/lib/brand";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Display face for headlines: characterful, so the brand doesn't read as a template.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: `${BRAND.name}: know if a car insurance claim is worth it`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: [
    'car insurance claim calculator',
    'should I claim car insurance',
    'no claim bonus calculator India',
    'NCB loss calculator',
    'car insurance depreciation',
    'IDV',
    'repair estimate insurance',
    'fleet insurance claims',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    locale: 'en_IN',
    url: '/',
    title: `${BRAND.name}: know if a car insurance claim is worth it`,
    description: BRAND.description,
  },
  twitter: { card: 'summary_large_image', title: `${BRAND.name}: know if a car insurance claim is worth it`, description: BRAND.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

// Site-wide structured data: what the site is and who runs it (no invented claims).
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${BRAND.siteUrl}/#website`, url: BRAND.siteUrl, name: BRAND.name, description: BRAND.description, inLanguage: 'en-IN' },
    { '@type': 'Organization', '@id': `${BRAND.siteUrl}/#org`, name: BRAND.name, url: BRAND.siteUrl, logo: `${BRAND.siteUrl}/icon.svg`, email: BRAND.contactEmail },
    {
      '@type': 'WebApplication',
      name: BRAND.name,
      url: BRAND.siteUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description: BRAND.description,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${display.variable}`}>
      <body className="font-sans antialiased bg-background text-navy-900 selection:bg-signal selection:text-navy-950">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <AuthProvider>
          <VehicleProvider>
            <AssistantProvider>
              {children}
              <AssistantWidget />
            </AssistantProvider>
          </VehicleProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
