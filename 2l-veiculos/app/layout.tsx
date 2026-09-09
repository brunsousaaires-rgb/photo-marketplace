import type { Metadata } from 'next';
import { Bebas_Neue, Inter } from 'next/font/google';
import './globals.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import CustomCursor from '@/components/CustomCursor';
import LoadingScreen from '@/components/LoadingScreen';
import ScrollProgress from '@/components/ScrollProgress';
import WhatsAppButton from '@/components/WhatsAppButton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const display = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const siteUrl = 'https://2lveiculos.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '2L Veículos — Sua próxima história começa na 2L',
    template: '%s | 2L Veículos',
  },
  description:
    '2L Veículos em Trindade-GO: 12 anos de experiência em compra, venda, troca e financiamento de veículos. Encontre o seu próximo carro.',
  keywords: ['2L Veículos', 'carros Trindade GO', 'concessionária Trindade', 'financiamento de veículos', 'comprar carro Goiás'],
  authors: [{ name: '2L Veículos' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: '2L Veículos',
    title: '2L Veículos — Sua próxima história começa na 2L',
    description: '12 anos de experiência em compra, venda, troca e financiamento de veículos em Trindade-GO.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '2L Veículos',
    description: '12 anos de experiência em compra, venda, troca e financiamento de veículos em Trindade-GO.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="cursor-none-desktop font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'AutomotiveBusiness',
              name: '2L Veículos',
              image: `${siteUrl}/og-image.jpg`,
              url: siteUrl,
              telephone: '+5562985169550',
              priceRange: '$$',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Av. Manoel Monteiro, Jardim Salvador, nº 80',
                addressLocality: 'Trindade',
                addressRegion: 'GO',
                addressCountry: 'BR',
              },
              sameAs: ['https://www.instagram.com/2lveiculoss/'],
            }),
          }}
        />
        <LoadingScreen />
        <ScrollProgress />
        <CustomCursor />
        <SmoothScrollProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </SmoothScrollProvider>
        <WhatsAppButton />
      </body>
    </html>
  );
}
