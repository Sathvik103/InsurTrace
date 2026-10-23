import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { VehicleProvider } from "@/context/VehicleContext";
import { Toaster } from "sonner";
import { AssistantProvider } from "@/context/AssistantContext";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VeriSure — Insurance Intelligence & Verification",
  description: "Deterministic financial modeling, document provenance, and cryptographically verified vehicle records.",
  openGraph: {
    title: "VeriSure — Insurance Intelligence & Verification",
    description: "Deterministic financial modeling, document provenance, and cryptographically verified vehicle records.",
    siteName: "VeriSure",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background text-navy-900 selection:bg-steel-200 selection:text-navy-950">
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
