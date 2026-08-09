import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

async function getSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_GAS_URL}?action=getSettings`, {
      cache: 'no-store'
    });
    return await res.json();
  } catch (e) {
    return {
      headerImage: '',
      statusPenyertaan: 'BUKA',
      footerText: '@2026, DIY Audit Arahan Amalan JKSM',
      notis: 'Selamat Datang ke Sistem Audit Pematuhan Arahan Amalan JKSM.'
    };
  }
}

export default async function HomePage() {
  const settings = await getSettings();
  const isOpen = settings.statusPenyertaan === 'BUKA';

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen">
      {/* 1. Header Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-slate-800" />
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              DIY SAPAA <span className="text-blue-700">JKSM</span>
            </span>
          </div>

          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-all shadow-sm flex items-center gap-2">
                  Log Masuk <ArrowRight className="w-4 h-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Ke Dashboard
                </Link>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* 2. Header Banner Image Dynamic dari Google Sheet */}
      {settings.headerImage && (
        <div className="w-full bg-slate-900 overflow-hidden border-b border-slate-200">
          <div className="max-w-7xl mx-auto h-48 md:h-64 relative">
            <img 
              src={settings.headerImage} 
              alt="Banner Header Audit JKSM" 
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </div>
      )}

      {/* 3. Hero Section / Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 md:p-12 relative overflow-hidden">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status Permohonan Audit
            </span>
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Penyertaan DIBUKA
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3.5 h-3.5" /> Penyertaan DITUTUP
              </span>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Sistem DIY Audit Arahan Amalan
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              {settings.notis || "Platform rasmi penilaian dan pengauditan kendiri Arahan Amalan untuk Mahkamah Syariah Daerah seluruh Malaysia."}
            </p>
          </div>

          {/* Action Area */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-700/20 text-center">
                  Mula Isi Borang Audit
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 text-center"
              >
                Akses Dashboard Penyertaan
              </Link>
            </SignedIn>
          </div>

        </div>
      </main>

      {/* 4. Dynamic Footer dari Google Sheet */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm font-medium">
          {settings.footerText || "@2026, DIY Audit Arahan Amalan JKSM"}
        </div>
      </footer>
    </div>
  );
}