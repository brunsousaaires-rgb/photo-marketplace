import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site.config";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const title = "Zequinha Veículos | Compra, Venda e Troca de Carros em Trindade - GO";

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title,
  description: site.description,
  keywords: [
    "carros Trindade GO",
    "compra e venda de carros Trindade",
    "troca de carros Goiás",
    "Zequinha Veículos",
    "concessionária Trindade GO",
  ],
  openGraph: {
    title,
    description: site.description,
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    url: site.siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/icon.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: site.name,
  description: site.description,
  areaServed: `${site.city} - ${site.state}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city,
    addressRegion: site.state,
    addressCountry: "BR",
  },
  sameAs: [site.instagramUrl],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body
        className={`${display.variable} ${sans.variable} bg-black font-sans text-white antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="noise-overlay" />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <WhatsAppButton />
        <CustomCursor />
      </body>
    </html>
  );
}
