import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollEffects } from "@/components/layout/ScrollEffects";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "LifeSure AI | Plan Better. Choose Smarter. Protect What Matters.",
  description: "India's intelligent financial protection platform. Transparent life cover assessment, explainable plan matching using real insurer data, Scenario Studio, and Policy X-Ray.",
  keywords: "life insurance, term insurance, life cover calculator, scenario studio, policy xray, HLV calculator, insurance india, IRDAI",
  openGraph: {
    title: "LifeSure AI | Intelligent Insurance Advisory",
    description: "Calculate your protection needs, explore relevant insurance options and prepare for life's uncertainties with personalised, explainable guidance.",
    url: "https://lifesure.ai",
    siteName: "LifeSure AI",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col text-[#24212B] font-sans antialiased">
        {/* Skip to Content for Keyboard Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#7957FF] text-[#FFFFFF] font-bold rounded shadow-lg"
        >
          Skip to main content
        </a>

        <AuthProvider>
        <ScrollEffects />
        <Navbar />
        
        <main id="main-content" className="flex-grow">
          {children}
        </main>

        <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
