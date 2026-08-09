import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DIY Audit Arahan Amalan JKSM',
  description: 'Sistem Audit DIY Arahan Amalan Jabatan Kehakiman Syariah Malaysia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ms">
        <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}