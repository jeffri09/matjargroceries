import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Matjar Groceries - Fresh Daily Online Shopping',
    template: '%s | Matjar Groceries',
  },
  description:
    'Shop fresh produce, fruits, halal meat, dairy, and pantry essentials online. Fast delivery from farm to your door. Free shipping on orders over $50.',
  keywords: [
    'online grocery shopping',
    'fresh produce',
    'matjar groceries',
    'online fruit delivery',
    'pantry essentials',
    'fresh halal meat',
    'grocery delivery',
    'online grocery store',
  ],
  authors: [{ name: 'Matjar Groceries' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Matjar Groceries',
    title: 'Matjar Groceries - Fresh Daily Online Shopping',
    description:
      'Shop fresh produce, fruits, halal meat, dairy, and pantry essentials online. Fast delivery from farm to your door.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Matjar Groceries - Fresh Daily Online Shopping',
    description:
      'Shop fresh groceries online. Fast delivery from farm to your door.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#16a34a" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Matjar Groceries" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif', paddingBottom: '72px' }}>
        <Header />
        {children}
        <Footer />
        <BottomNav />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
