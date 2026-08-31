import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://dsh-project-atlas.dr-satim.chatgpt.site'),
  title: 'DSH Project Atlas — Agent-ready architecture control',
  description:
    'A shared, read-only semantic graph where people and agents investigate project architecture together.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'DSH Project Atlas',
    description: 'Projects made legible to people and agents through a read-only WebMCP workspace.',
    siteName: 'DSH Project Atlas',
    images: [
      {
        url: '/og.png',
        width: 1536,
        height: 1024,
        alt: 'DSH Project Atlas semantic graph workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DSH Project Atlas',
    description: 'Projects made legible to people and agents.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
