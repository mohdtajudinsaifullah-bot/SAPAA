'use client';

import { useState, useEffect } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock, CheckCircle2, Calendar, CheckSquare } from 'lucide-react';

export default function HomePage() {
  const [settings, setSettings] = useState<any>({
    banners: [],
    statusPenyertaan: 'BUKA',
    footerText: '@2026, DIY Audit Arahan Amalan JKSM',
    notis: ''
  });
  const [pemantauan, setPemantauan] = useState<any>({
    jadual: [],
    submitted: []
  });

  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

  useEffect(() => {
    const fetchData = async () => {
      if (!gasUrl) return;
      try {
        const [resSettings, resPemantauan] = await Promise.all([
          fetch(`${gasUrl}?action=getSettings`),
          fetch(`${gasUrl}?action=getJadualPemantauan`)
        ]);

        const dataSet = await resSettings.json();
        const dataPem = await resPemantauan.json();

        if (dataSet) setSettings(dataSet);
        if (dataPem) setPemantauan(dataPem);
      } catch (e) {
        console.error('Ralat memuatkan data homepage:', e);
      }
    };

    fetchData();
  }, [gasUrl]);

  const isOpen = settings?.statusPenyertaan === 'BUKA';
  const banners = Array.isArray(settings?.banners) ? settings.banners : [];
  const jadualList = Array.isArray(pemantauan?.jadual) ? pemantauan.jadual : [];
  const submittedList = Array.isArray(pemantauan?.submitted) ? pemantauan.submitted : [];

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-700" />
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              DIY SAPAA <span className="text-blue-700">JKSM</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <span className="px-3 py-1.5 bg-white shadow-sm text-blue-700 rounded-md">Home</span>
              <Link href="/dashboard" className="px-3 py-1.5 text-slate-600 hover:text-slate-900">Dashboard</Link>
            </nav>

            <SignedIn>
              <UserButton />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
                  Log Masuk <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="w-full bg-slate-900 overflow-hidden border-b border-slate-200">
          <div className="max-w-7xl mx-auto h-52 md:h-64 relative flex items-center justify-center overflow-x-auto gap-2 p-2">
            {banners.map((url: string, idx: number) => (
              <img
                key={idx}
                src={url}
                alt={`Banner ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="h-full object-cover rounded-lg shadow-md min-w-[300px]"
              />
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Status Permohonan Audit
            </span>
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Penyertaan DIBUKA
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3.5 h-3.5" /> Penyertaan DITUTUP
              </span>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sistem DIY Audit Arahan Amalan JKSM
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              {settings.notis || "Platform rasmi penilaian dan pengauditan kendiri Arahan Amalan untuk Mahkamah Syariah Daerah seluruh Malaysia."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t flex items-center gap-3">
            <SignedIn>
              <Link href="/dashboard" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition shadow-md">
                Akses Dashboard Penyertaan
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition shadow-md">
                  Mula Isi Borang Audit (Log Masuk)
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Jadual & Status Penyerahan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-semibold text-xs flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Jadual Pemantauan Audit Syariah
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b font-bold text-slate-700">
                  <tr>
                    <th className="p-3">Negeri / Daerah</th>
                    <th className="p-3">Auditer</th>
                    <th className="p-3">Tarikh Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jadualList.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-400">Tiada maklumat jadual.</td></tr>
                  ) : (
                    jadualList.map((j: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{j.daerah}, {j.negeri}</td>
                        <td className="p-3 text-slate-600">{j.oditer || 'Akan Ditentukan'}</td>
                        <td className="p-3 font-bold text-blue-700">{j.tarikhAudit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-semibold text-xs flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" /> Status Penyerahan Daerah
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b font-bold text-slate-700">
                  <tr>
                    <th className="p-3">Negeri / Daerah</th>
                    <th className="p-3">Tarikh Penyerahan</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submittedList.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-400">Belum ada penyerahan lagi.</td></tr>
                  ) : (
                    submittedList.map((s: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{s.daerah}, {s.negeri}</td>
                        <td className="p-3 text-slate-600">{s.tarikhSubmit}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                            DIHANTAR
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-center text-xs">
        {settings?.footerText || "@2026, DIY Audit Arahan Amalan JKSM"}
      </footer>
    </div>
  );
}