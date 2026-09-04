import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'DIY SAPAA JKSM',
  description: 'Sistem Audit Arahan Amalan JKSM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="ms">
        <body className="antialiased min-h-screen flex flex-col bg-slate-50">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}