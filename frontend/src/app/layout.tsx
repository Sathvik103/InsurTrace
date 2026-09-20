import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { VehicleProvider } from "@/context/VehicleContext";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="en" className={geist.variable}>
      <body className="font-sans antialiased text-zinc-900 bg-white dark:bg-zinc-950 dark:text-zinc-50 selection:bg-zinc-900 selection:text-white">
        <AuthProvider>
          <VehicleProvider>
            {children}
          </VehicleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
