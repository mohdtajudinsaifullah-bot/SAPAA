import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistem DIY Audit Arahan Amalan JKSM',
  description: 'Platform rasmi penilaian dan pengauditan kendiri Arahan Amalan untuk Mahkamah Syariah Daerah seluruh Malaysia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}