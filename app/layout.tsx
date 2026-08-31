import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DSH Project Atlas — Agent-ready architecture control',
  description:
    'A shared, read-only semantic graph where people and agents investigate project architecture together.',
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
