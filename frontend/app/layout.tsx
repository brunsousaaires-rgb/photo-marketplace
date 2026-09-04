import type { Metadata } from 'next';
import { Inter, Anton } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileTabBar } from '@/components/MobileTabBar';
import { Toaster } from '@/components/ui/toaster';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Photo Marketplace — Fotos de esporte em HD',
  description:
    'Encontre as fotos do seu jogo: vôlei, futevôlei, beach tennis e mais. Prévia com marca d’água, compra segura e download em HD na hora.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased flex flex-col bg-paper text-ink-950">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileTabBar />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
