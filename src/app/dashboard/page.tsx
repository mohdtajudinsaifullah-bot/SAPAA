'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle, Lock, Edit3, Award, Users, AlertCircle, Printer, PlusCircle, ToggleLeft, ToggleRight, Save } from 'lucide-react';

interface Soalan {
  id: string;
  text: string;
  kategori: 'MRS' | 'MTS' | 'KEDUA-DUA';
  jenis: 'Objektif' | 'Subjektif';
  pilihan: string[];
  markahMax: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<'Oditee' | 'Oditer' | 'Admin'>('Oditee');
  
  // Profil Oditee
  const [profil, setProfil] = useState({
    nama: '',
    noTel: '',
    hierarki: 'MRS', // MRS / MTS
    negeri: 'Selangor',
    daerah: 'Petaling'
  });

  const [settings, setSettings] = useState({ statusPenyertaan: 'BUKA', footerText: '@2026, DIY Audit Arahan Amalan JKSM' });
  const [soalanList, setSoalanList] = useState<Soalan[]>([]);
  const [jawapan, setJawapan] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Admin Form State
  const [newQ, setNewQ] = useState({ text: '', kategori: 'MRS', jenis: 'Objektif', pilihan: 'Ya,Tidak,Sebahagian', markahMax: 10 });

  // Oditer State
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [markahInput, setMarkahInput] = useState<Record<string, number>>({});
  const [ulasanOditer, setUlasanOditer] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

  // Set Auto-Fill Nama dari Clerk
  useEffect(() => {
    if (user) {
      setProfil(prev => ({
        ...prev,
        nama: prev.nama || user.fullName || user.username || ''
      }));
      // Mengambil role dari Clerk Metadata jika ada
      const r = (user.publicMetadata?.role as any) || 'Oditee';
      setRole(r);
    }
  }, [user]);

  // Load Data dari GAS
  const loadAllData = async () => {
    if (!gasUrl || !user) return;
    try {
      setLoading(true);
      const email = user.primaryEmailAddress?.emailAddress;

      const [resSet, resProf] = await Promise.all([
        fetch(`${gasUrl}?action=getSettings`),
        fetch(`${gasUrl}?action=getProfil&email=${email}`)
      ]);

      const dataSet = await resSet.json();
      const dataProf = await resProf.json();

      setSettings(dataSet);
      if (dataProf.nama) setProfil(prev => ({ ...prev, ...dataProf }));

      // Ambil Soalan mengikut Hierarki Oditee (MRS/MTS)
      const resQ = await fetch(`${gasUrl}?action=getSoalan&kategori=${dataProf.hierarki || 'MRS'}`);
      const dataQ = await resQ.json();
      setSoalanList(Array.isArray(dataQ) ? dataQ : []);

      // Jika Admin / Oditer, load semua submisyen
      if (role === 'Admin' || role === 'Oditer') {
        const resSub = await fetch(`${gasUrl}?action=getAllSubmissions`);
        const dataSub = await resSub.json();
        setSubmissions(Array.isArray(dataSub) ? dataSub : []);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) loadAllData();
  }, [isLoaded, user, role]);

  // Simpan / Kemaskini Profil Oditee
  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfil',
          email: user?.primaryEmailAddress?.emailAddress,
          ...profil
        })
      });
      const data = await res.json();
      setStatusMsg({ type: 'success', text: data.message });
      loadAllData(); // Reload soalan ikut hierarki baru
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal mengemaskini profil.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Oditee Hantar Jawapan
  const handleSubmitJawapan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.statusPenyertaan !== 'BUKA') {
      setStatusMsg({ type: 'error', text: 'Penyertaan telah DITUTUP oleh Admin.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitJawapan',
          email: user?.primaryEmailAddress?.emailAddress,
          nama: profil.nama,
          hierarki: profil.hierarki,
          negeri: profil.negeri,
          daerah: profil.daerah,
          jawapan: jawapan
        })
      });
      const data = await res.json();
      setStatusMsg({ type: data.success ? 'success' : 'error', text: data.message });
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Ralat menyimpan jawapan.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Toggle Buka/Tutup
  const handleToggleStatus = async () => {
    const nextStatus = settings.statusPenyertaan === 'BUKA' ? 'TUTUP' : 'BUKA';
    try {
      await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus', statusPenyertaan: nextStatus })
      });
      setSettings(prev => ({ ...prev, statusPenyertaan: nextStatus }));
      setStatusMsg({ type: 'success', text: `Status penyertaan ditukar kepada ${nextStatus}` });
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal menukar status.' });
    }
  };

  // Admin: Tambah Soalan
  const handleAddSoalan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addSoalan',
          ...newQ,
          pilihan: newQ.pilihan.split(',')
        })
      });
      const data = await res.json();
      setStatusMsg({ type: 'success', text: data.message });
      setNewQ({ text: '', kategori: 'MRS', jenis: 'Objektif', pilihan: 'Ya,Tidak,Sebahagian', markahMax: 10 });
      loadAllData();
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal menambah soalan.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Oditer: Simpan Markah
  const handleSavePenilaian = async () => {
    if (!selectedSub) return;
    setSubmitting(true);
    
    // Kira Jumlah Markah
    const totalMark = Object.values(markahInput).reduce((a, b) => Number(a) + Number(b), 0);
    const maxMark = soalanList.reduce((a, b) => a + Number(b.markahMax), 0);

    try {
      const res = await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'savePenilaian',
          idJawapan: selectedSub.idJawapan,
          daerah: selectedSub.daerah,
          markahJSON: markahInput,
          ulasan: ulasanOditer,
          jumlahMarkah: totalMark,
          markahMax: maxMark
        })
      });
      const data = await res.json();
      setStatusMsg({ type: 'success', text: data.message });
      setSelectedSub(null);
      loadAllData();
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal menyimpan penilaian.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Function Print PDF
  const handlePrint = () => {
    window.print();
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 text-sm font-medium">Memuatkan Sistem DIY Audit...</p>
        </div>
      </div>
    );
  }

  const isClosed = settings.statusPenyertaan === 'TUTUP';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between print:bg-white">
      {/* Top Bar Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none">DIY Audit Arahan Amalan JKSM</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Peranan: <span className="text-blue-300 font-semibold">{role}</span> ({profil.daerah})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Switch Role (For Testing) */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1"
            >
              <option value="Oditee">Oditee View</option>
              <option value="Oditer">Oditer View</option>
              <option value="Admin">Admin View</option>
            </select>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">

        {statusMsg && (
          <div className={`p-4 rounded-lg text-sm font-medium flex items-center gap-2 print:hidden ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            {statusMsg.text}
          </div>
        )}

        {/* ==================== 1. MODUL ADMIN ==================== */}
        {role === 'Admin' && (
          <div className="space-y-6 print:hidden">
            {/* Control Panel Buka/Tutup */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tetapan Status Penyertaan Audit</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kawal kebenaran Oditee untuk menghantar atau mengemaskini jawapan.</p>
              </div>
              <button
                onClick={handleToggleStatus}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
                  settings.statusPenyertaan === 'BUKA' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {settings.statusPenyertaan === 'BUKA' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                Status: {settings.statusPenyertaan}
              </button>
            </div>

            {/* Borang Bina Soalan */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" /> Tambah Soalan Baharu
              </h2>
              <form onSubmit={handleAddSoalan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-slate-700">Teks Soalan</label>
                  <input
                    required
                    type="text"
                    value={newQ.text}
                    onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                    placeholder="Masukkan soalan audit..."
                    className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Kategori Mahkamah</label>
                  <select
                    value={newQ.kategori}
                    onChange={(e) => setNewQ({ ...newQ, kategori: e.target.value as any })}
                    className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-slate-50"
                  >
                    <option value="MRS">MRS (Mahkamah Rendah Syariah)</option>
                    <option value="MTS">MTS (Mahkamah Tinggi Syariah)</option>
                    <option value="KEDUA-DUA">KEDUA-DUA</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Jenis Soalan</label>
                  <select
                    value={newQ.jenis}
                    onChange={(e) => setNewQ({ ...newQ, jenis: e.target.value as any })}
                    className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-slate-50"
                  >
                    <option value="Objektif">Objektif (Pilihan)</option>
                    <option value="Subjektif">Subjektif (Teks Huraian)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Markah Maksimum</label>
                  <input
                    type="number"
                    value={newQ.markahMax}
                    onChange={(e) => setNewQ({ ...newQ, markahMax: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-slate-50"
                  />
                </div>
                {newQ.jenis === 'Objektif' && (
                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-slate-700">Pilihan Jawapan (Pisahkan dengan koma)</label>
                    <input
                      type="text"
                      value={newQ.pilihan}
                      onChange={(e) => setNewQ({ ...newQ, pilihan: e.target.value })}
                      placeholder="Ya,Tidak,Sebahagian"
                      className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-slate-50"
                    />
                  </div>
                )}
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
                    {submitting ? 'Menyimpan...' : 'Tambah Soalan'}
                  </button>
                </div>
              </form>
            </div>

            {/* Dashboard Keseluruhan Jawapan & Markah */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white font-semibold text-sm flex justify-between items-center">
                <span>Senarai Penyerahan & Penilaian Daerah (Keseluruhan)</span>
                <span className="text-xs bg-slate-800 px-3 py-1 rounded-full">{submissions.length} Penyerahan</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3">Daerah / Negeri</th>
                      <th className="p-3">Hierarki</th>
                      <th className="p-3">Oditee</th>
                      <th className="p-3">Tarikh Hantar</th>
                      <th className="p-3">Markah Keseluruhan</th>
                      <th className="p-3">Status Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {submissions.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-500">Tiada penyerahan jawapan lagi.</td></tr>
                    ) : (
                      submissions.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{sub.daerah}, {sub.negeri}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{sub.hierarki}</span></td>
                          <td className="p-3">{sub.nama}<br/><span className="text-slate-400">{sub.email}</span></td>
                          <td className="p-3">{new Date(sub.tarikh).toLocaleDateString()}</td>
                          <td className="p-3 font-bold text-slate-900">
                            {sub.penilaian ? `${sub.penilaian.jumlahMarkah} / ${sub.penilaian.markahMax}` : 'Belum Dinilai'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${sub.penilaian ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {sub.penilaian ? 'SELESAI' : 'MENUNGGU'}
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
        )}

        {/* ==================== 2. MODUL ODITEE ==================== */}
        {role === 'Oditee' && (
          <div className="space-y-8">
            {/* Profil Kemaskini */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" /> Profil & Maklumat Mahkamah Oditee
                </h2>
                <span className="text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-600">Auto-filled via Clerk</span>
              </div>
              <form onSubmit={handleSaveProfil} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Nama Pegawai / Oditee</label>
                  <input
                    type="text"
                    value={profil.nama}
                    onChange={(e) => setProfil({ ...profil, nama: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg bg-slate-50 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Emel Log Masuk</label>
                  <input
                    disabled
                    type="text"
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    className="w-full mt-1 p-2.5 border rounded-lg bg-slate-200 text-slate-600 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">No. Telefon</label>
                  <input
                    type="text"
                    placeholder="012-3456789"
                    value={profil.noTel}
                    onChange={(e) => setProfil({ ...profil, noTel: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hierarki Mahkamah</label>
                  <select
                    value={profil.hierarki}
                    onChange={(e) => setProfil({ ...profil, hierarki: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg bg-slate-50 text-sm font-medium"
                  >
                    <option value="MRS">MRS (Mahkamah Rendah Syariah)</option>
                    <option value="MTS">MTS (Mahkamah Tinggi Syariah)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Negeri</label>
                  <input
                    type="text"
                    value={profil.negeri}
                    onChange={(e) => setProfil({ ...profil, negeri: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Daerah</label>
                  <input
                    type="text"
                    value={profil.daerah}
                    onChange={(e) => setProfil({ ...profil, daerah: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg bg-slate-50 text-sm"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-slate-900 text-white rounded-lg font-medium text-xs flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Simpan Profil
                  </button>
                </div>
              </form>
            </div>

            {/* Status Penyertaan Warning */}
            {isClosed && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3 print:hidden">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 text-sm">Penyertaan Telah DITUTUP oleh Admin</h3>
                  <p className="text-amber-700 text-xs mt-0.5">Soalan dan jawapan kini berada dalam mod paparan sahaja. Pembetulan tidak lagi dibenarkan.</p>
                </div>
              </div>
            )}

            {/* Borang Soalan Oditee */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:bg-white print:text-black print:border-b">
                <div>
                  <h2 className="font-bold text-lg">Borang Penilaian DIY Audit Arahan Amalan</h2>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Kategori: <span className="text-blue-400 font-bold print:text-black">{profil.hierarki}</span> | Daerah: {profil.daerah}, {profil.negeri}
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 print:hidden"
                >
                  <Printer className="w-4 h-4" /> Cetak / PDF
                </button>
              </div>

              <form onSubmit={handleSubmitJawapan} className="p-6 md:p-8 space-y-8">
                {soalanList.map((q, idx) => (
                  <div key={q.id || idx} className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 print:bg-white print:border-slate-300">
                    <div className="flex items-start justify-between gap-4">
                      <label className="font-semibold text-slate-900 text-sm">
                        {idx + 1}. {q.text}
                      </label>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-semibold whitespace-nowrap print:border">
                        Max: {q.markahMax}m
                      </span>
                    </div>

                    {q.jenis === 'Objektif' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {(q.pilihan.length > 0 ? q.pilihan : ['Ya', 'Tidak', 'Sebahagian']).map((opt) => (
                          <label key={opt} className={`flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer ${
                            jawapan[q.id] === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium' : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={opt}
                              disabled={isClosed}
                              checked={jawapan[q.id] === opt}
                              onChange={(e) => setJawapan({ ...jawapan, [q.id]: e.target.value })}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        disabled={isClosed}
                        placeholder="Taip huraian jawapan anda di sini..."
                        value={jawapan[q.id] || ''}
                        onChange={(e) => setJawapan({ ...jawapan, [q.id]: e.target.value })}
                        className="w-full p-3 rounded-lg border border-slate-300 text-sm bg-white disabled:bg-slate-100"
                      />
                    )}
                  </div>
                ))}

                {!isClosed && (
                  <div className="pt-4 border-t flex justify-end print:hidden">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-md"
                    >
                      {submitting ? 'Menyimpan...' : 'Hantar / Kemaskini Jawapan'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ==================== 3. MODUL ODITER ==================== */}
        {role === 'Oditer' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Modul Penilaian & Semakan Oditer</h2>
              <p className="text-xs text-slate-500 mt-1">Pilih penyerahan jawapan daerah untuk membuat semakan dan memberi markah secara dalam talian.</p>
            </div>

            {/* Table Senarai Daerah */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-900 text-white font-semibold text-sm">
                Senarai Jawapan Dihantar Mengikut Daerah
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3">Daerah / Negeri</th>
                      <th className="p-3">Hierarki</th>
                      <th className="p-3">Nama Oditee</th>
                      <th className="p-3">Jumlah Markah</th>
                      <th className="p-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {submissions.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{sub.daerah}, {sub.negeri}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{sub.hierarki}</span></td>
                        <td className="p-3">{sub.nama}</td>
                        <td className="p-3 font-bold">
                          {sub.penilaian ? `${sub.penilaian.jumlahMarkah} / ${sub.penilaian.markahMax}` : 'Belum Dinilai'}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedSub(sub);
                              setMarkahInput(sub.penilaian?.markahJSON || {});
                              setUlasanOditer(sub.penilaian?.ulasan || '');
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                          >
                            Semak & Beri Markah
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal / Panel Semakan Markah */}
            {selectedSub && (
              <div className="bg-white rounded-xl border-2 border-blue-500 p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-900">Semakan Penilaian: {selectedSub.daerah} ({selectedSub.hierarki})</h3>
                    <p className="text-xs text-slate-500">Oditee: {selectedSub.nama} ({selectedSub.email})</p>
                  </div>
                  <button onClick={handlePrint} className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded flex items-center gap-1">
                    <Printer className="w-4 h-4" /> Print PDF Penilaian
                  </button>
                </div>

                <div className="space-y-4">
                  {soalanList.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-lg border text-xs space-y-2">
                      <div className="font-semibold text-slate-900">{idx + 1}. {q.text}</div>
                      <div className="p-2.5 bg-white border rounded text-slate-800">
                        <span className="font-semibold text-slate-500">Jawapan Oditee: </span>
                        {selectedSub.jawapanJSON[q.id] || <span className="italic text-slate-400">Tiada Jawapan</span>}
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="font-semibold text-slate-700">Markah Oditer (Max: {q.markahMax}):</label>
                        <input
                          type="number"
                          max={q.markahMax}
                          min={0}
                          value={markahInput[q.id] ?? 0}
                          onChange={(e) => setMarkahInput({ ...markahInput, [q.id]: Number(e.target.value) })}
                          className="w-20 p-1.5 border rounded text-center font-bold bg-white"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <label className="font-semibold text-xs text-slate-700">Ulasan Keseluruhan Oditer</label>
                    <textarea
                      rows={3}
                      value={ulasanOditer}
                      onChange={(e) => setUlasanOditer(e.target.value)}
                      placeholder="Masukkan ulasan atau cadangan penambahbaikan..."
                      className="w-full mt-1 p-2.5 border rounded-lg text-xs bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  <div className="text-sm font-bold text-slate-900">
                    Jumlah Markah: <span className="text-blue-700">{Object.values(markahInput).reduce((a, b) => Number(a) + Number(b), 0)}</span> / {soalanList.reduce((a, b) => a + Number(b.markahMax), 0)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedSub(null)} className="px-4 py-2 bg-slate-200 rounded text-xs font-semibold text-slate-700">Batal</button>
                    <button onClick={handleSavePenilaian} disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700">
                      {submitting ? 'Menyimpan...' : 'Simpan Penilaian'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-center text-xs print:hidden">
        {settings.footerText || '@2026, DIY Audit Arahan Amalan JKSM'}
      </footer>
    </div>
  );
}