'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle, Edit3, AlertCircle, Printer, PlusCircle, ToggleLeft, ToggleRight, Save, Trash2, Edit, FileCheck2, CheckSquare, LogOut } from 'lucide-react';

interface Soalan {
  id: string;
  text: string;
  kategori: 'MRS' | 'MTS' | 'KEDUA-DUA';
  jenis: 'Objektif' | 'Subjektif' | 'Multiple Choice' | 'Kombinasi';
  pilihan: string[];
  markahMax: number;
  borang: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<'Oditee' | 'Oditer' | 'Admin'>('Oditee');
  const [selectedBorang, setSelectedBorang] = useState<string>('Audit Arahan Amalan');

  // Profil Oditee
  const [profil, setProfil] = useState({
    nama: '',
    noTel: '',
    hierarki: 'MRS',
    negeri: 'Selangor',
    daerah: 'Petaling'
  });

  const [settings, setSettings] = useState({ statusPenyertaan: 'BUKA', footerText: '@2026, DIY Audit Arahan Amalan JKSM' });
  const [soalanList, setSoalanList] = useState<Soalan[]>([]);
  const [jawapan, setJawapan] = useState<Record<string, any>>({});
  const [penilaianOditerForOditee, setPenilaianOditerForOditee] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Admin State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQ, setNewQ] = useState({ 
    text: '', 
    kategori: 'MRS', 
    jenis: 'Objektif' as any, 
    pilihan: 'Ya,Tidak,Sebahagian', 
    markahMax: 10
  });

  // Oditer State
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [oditerSoalanList, setOditerSoalanList] = useState<Soalan[]>([]);
  const [markahInput, setMarkahInput] = useState<Record<string, number>>({});
  const [noAAInput, setNoAAInput] = useState<Record<string, string>>({});
  const [penemuanBuktiInput, setPenemuanBuktiInput] = useState<Record<string, string>>({});
  const [catatanInput, setCatatanInput] = useState<Record<string, string>>({});
  const [sebabInput, setSebabInput] = useState<Record<string, string>>({});
  const [tickedInput, setTickedInput] = useState<Record<string, boolean>>({});
  const [ulasanOditer, setUlasanOditer] = useState('');
  
  // State Laporan Pemantauan
  const [tarikhPemantauan, setTarikhPemantauan] = useState<string>(new Date().toISOString().split('T')[0]);
  const [namaKetuaPemantau, setNamaKetuaPemantau] = useState<string>('');
  const [selectedMultiDaerah, setSelectedMultiDaerah] = useState<string[]>([]);
  
  // View Tab: 'semakan' | 'borang_daerah' | 'laporan_gabungan'
  const [viewTab, setViewTab] = useState<'semakan' | 'borang_daerah' | 'laporan_gabungan'>('semakan');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
  const isAuditForm = selectedBorang === 'Audit Arahan Amalan';

  // Semak Sesi Log Masuk
  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) {
      router.push('/login');
      return;
    }
    const userObj = JSON.parse(session);
    setCurrentUser(userObj);
    setProfil({
      nama: userObj.nama || '',
      noTel: userObj.noTel || '',
      hierarki: userObj.hierarki || 'MRS',
      negeri: userObj.negeri || 'Selangor',
      daerah: userObj.daerah || 'Petaling'
    });
    setNamaKetuaPemantau(userObj.nama || '');
  }, [router]);

  const loadAllData = async () => {
    if (!gasUrl || !currentUser) return;
    try {
      setLoading(true);
      const email = currentUser.email;

      const [resSet, resProf] = await Promise.all([
        fetch(`${gasUrl}?action=getSettings`),
        fetch(`${gasUrl}?action=getProfil&email=${encodeURIComponent(email)}`)
      ]);

      const dataSet = await resSet.json();
      const dataProf = await resProf.json();

      setSettings(dataSet);

      let currentRole = 'Oditee';
      if (dataProf) {
        if (dataProf.nama) setProfil(prev => ({ ...prev, ...dataProf }));
        if (dataProf.role) {
          currentRole = dataProf.role;
          setRole(dataProf.role as any);
        }
      }

      const qCategoryParam = (currentRole === 'Admin' || currentRole === 'Oditer') ? '' : (dataProf?.hierarki || 'MRS');
      const resQ = await fetch(`${gasUrl}?action=getSoalan&kategori=${qCategoryParam}&borang=${encodeURIComponent(selectedBorang)}`);
      const dataQ = await resQ.json();
      setSoalanList(Array.isArray(dataQ) ? dataQ : []);

      if (currentRole === 'Oditee') {
        const resJ = await fetch(`${gasUrl}?action=getJawapanOditee&email=${encodeURIComponent(email)}&borang=${encodeURIComponent(selectedBorang)}`);
        const dataJ = await resJ.json();
        if (dataJ.found && dataJ.jawapanJSON) {
          setJawapan(dataJ.jawapanJSON);
          if (dataJ.penilaian) {
            setPenilaianOditerForOditee(dataJ.penilaian);
          }
        } else {
          setJawapan({});
          setPenilaianOditerForOditee(null);
        }
      }

      if (currentRole === 'Admin' || currentRole === 'Oditer') {
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
    if (currentUser) loadAllData();
  }, [currentUser, selectedBorang]);

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/login');
  };

  const handleSelectSubmisyenForAudit = async (sub: any) => {
    setSelectedSub(sub);
    setMarkahInput(sub.penilaian?.markahJSON || {});
    setCatatanInput(sub.penilaian?.catatanJSON || {});
    setSebabInput(sub.penilaian?.sebabJSON || {});
    setNoAAInput(sub.penilaian?.noAAJSON || {});
    setPenemuanBuktiInput(sub.penilaian?.penemuanBuktiJSON || {});
    setTickedInput(sub.penilaian?.tickedJSON || {});
    setUlasanOditer(sub.penilaian?.ulasan || '');
    setSelectedMultiDaerah([sub.daerah]);
    setViewTab('semakan');

    try {
      const resQ = await fetch(`${gasUrl}?action=getSoalan&kategori=${sub.hierarki || 'MRS'}&borang=${encodeURIComponent(sub.borang || 'Audit Arahan Amalan')}`);
      const dataQ = await resQ.json();
      setOditerSoalanList(Array.isArray(dataQ) ? dataQ : []);
    } catch (e) {
      console.error('Ralat mengambil soalan:', e);
    }
  };

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateProfil',
          email: currentUser?.email,
          nama: profil.nama,
          noTel: profil.noTel,
          hierarki: profil.hierarki,
          negeri: profil.negeri,
          daerah: profil.daerah
        })
      });

      // Kemaskini sesi tempatan
      const updatedUser = { ...currentUser, ...profil };
      localStorage.setItem('user_session', JSON.stringify(updatedUser));

      setStatusMsg({ type: 'success', text: 'Profil berjaya dikemaskini!' });
      loadAllData();
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal mengemaskini profil.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckboxChange = (qId: string, opt: string, isChecked: boolean) => {
    const currentList: string[] = Array.isArray(jawapan[qId]) ? jawapan[qId] : [];
    if (isChecked) {
      setJawapan({ ...jawapan, [qId]: [...currentList, opt] });
    } else {
      setJawapan({ ...jawapan, [qId]: currentList.filter(item => item !== opt) });
    }
  };

  const handleKombinasiChange = (qId: string, field: 'pilihan' | 'huraian', val: string) => {
    const currentObj = (typeof jawapan[qId] === 'object' && !Array.isArray(jawapan[qId])) ? jawapan[qId] : { pilihan: '', huraian: '' };
    setJawapan({
      ...jawapan,
      [qId]: { ...currentObj, [field]: val }
    });
  };

  const handleSubmitJawapan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'submitJawapan',
          email: currentUser?.email,
          nama: profil.nama,
          hierarki: profil.hierarki,
          negeri: profil.negeri,
          daerah: profil.daerah,
          borang: selectedBorang,
          jawapan: jawapan
        })
      });

      setStatusMsg({ type: 'success', text: 'Jawapan/Pembetulan berjaya disimpan & dikemaskini!' });
      loadAllData();
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Ralat menyimpan jawapan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = settings.statusPenyertaan === 'BUKA' ? 'TUTUP' : 'BUKA';
    try {
      await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'toggleStatus', statusPenyertaan: nextStatus })
      });
      setSettings(prev => ({ ...prev, statusPenyertaan: nextStatus }));
      setStatusMsg({ type: 'success', text: `Status penyertaan ditukar kepada ${nextStatus}` });
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal menukar status.' });
    }
  };

  const handleAddSoalan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: editingId ? 'updateSoalan' : 'addSoalan',
          id: editingId,
          ...newQ,
          borang: selectedBorang,
          markahMax: isAuditForm ? newQ.markahMax : 0,
          pilihan: newQ.jenis !== 'Subjektif' ? newQ.pilihan.split(',') : []
        })
      });
      setStatusMsg({ type: 'success', text: editingId ? 'Soalan berjaya dikemaskini!' : 'Soalan berjaya ditambah!' });
      setEditingId(null);
      setNewQ({ text: '', kategori: 'MRS', jenis: 'Objektif', pilihan: 'Ya,Tidak,Sebahagian', markahMax: 10 });
      loadAllData();
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal memproses soalan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePenilaian = async () => {
    if (!selectedSub) return;
    setSubmitting(true);
    
    const totalMark = Object.values(markahInput).reduce((a, b) => Number(a) + Number(b), 0);
    const maxMark = oditerSoalanList.reduce((a, b) => a + Number(b.markahMax), 0);

    try {
      await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'savePenilaian',
          idJawapan: selectedSub.idJawapan,
          daerah: selectedSub.daerah,
          markahJSON: markahInput,
          catatanJSON: catatanInput,
          sebabJSON: sebabInput,
          noAAJSON: noAAInput,
          penemuanBuktiJSON: penemuanBuktiInput,
          tickedJSON: tickedInput,
          ulasan: ulasanOditer,
          jumlahMarkah: totalMark,
          markahMax: maxMark
        })
      });
      setStatusMsg({ type: 'success', text: 'Penilaian & Data Pemantauan berjaya disimpan!' });
      loadAllData();
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Gagal menyimpan penilaian.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const sameStateSubmissions = submissions.filter(
    s => selectedSub && s.negeri === selectedSub.negeri && s.borang === selectedSub.borang
  );

  const aggregatedTickedItems = sameStateSubmissions
    .filter(s => selectedMultiDaerah.includes(s.daerah))
    .flatMap(s => {
      const ticked = s.penilaian?.tickedJSON || {};
      const noAA = s.penilaian?.noAAJSON || {};
      const penemuan = s.penilaian?.penemuanBuktiJSON || {};
      const catatan = s.penilaian?.catatanJSON || {};
      const sebab = s.penilaian?.sebabJSON || {};

      return Object.keys(ticked)
        .filter(qId => ticked[qId] === true)
        .map(qId => ({
          qId,
          daerah: s.daerah,
          negeri: s.negeri,
          noAA: noAA[qId] || `Soalan ${qId}`,
          penemuanBukti: penemuan[qId] || 'Tiada penemuan direkodkan',
          catatan: catatan[qId] || 'Tiada catatan',
          sebab: sebab[qId] || ''
        }));
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 text-sm font-medium">Memuatkan Sistem DIY Audit...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg text-xs font-semibold">
              <Link href="/" className="px-3 py-1 text-slate-300 hover:text-white">Home</Link>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-md">Dashboard</span>
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Keluar
            </button>
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

        {/* Pilihan Jenis Borang Dropdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">PILIH JENIS BORANG:</label>
          <select
            value={selectedBorang}
            onChange={(e) => {
              setSelectedBorang(e.target.value);
              setEditingId(null);
            }}
            className="w-full sm:w-auto p-2.5 border rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border-blue-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Audit Arahan Amalan">1. Borang DIY Audit Arahan Amalan</option>
            <option value="Maklumbalas Oditer">2. Borang Maklumbalas / Kepuasan Pelanggan (Oditer)</option>
            <option value="Cadangan Penambahbaikan">3. Borang Cadangan Penambahbaikan Arahan Amalan</option>
          </select>
        </div>

        {/* ==================== 1. MODUL ADMIN ==================== */}
        {role === 'Admin' && (
          <div className="space-y-6 print:hidden">
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

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" /> {editingId ? 'Kemaskini Soalan' : `Tambah Soalan Baharu (${selectedBorang})`}
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
                    className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-slate-50 font-medium"
                  >
                    <option value="Objektif">Objektif (Radio)</option>
                    <option value="Multiple Choice">Multiple Choice (Checkbox)</option>
                    <option value="Kombinasi">Kombinasi (Pilihan + Huraian)</option>
                    <option value="Subjektif">Subjektif (Teks Huraian)</option>
                  </select>
                </div>

                {isAuditForm && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Markah Maksimum</label>
                    <input
                      type="number"
                      value={newQ.markahMax}
                      onChange={(e) => setNewQ({ ...newQ, markahMax: Number(e.target.value) })}
                      className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-slate-50 font-bold text-blue-700"
                    />
                  </div>
                )}

                {newQ.jenis !== 'Subjektif' && (
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

                <div className="md:col-span-3 flex justify-end gap-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setNewQ({ text: '', kategori: 'MRS', jenis: 'Objektif', pilihan: 'Ya,Tidak,Sebahagian', markahMax: 10 });
                      }}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
                    >
                      Batal
                    </button>
                  )}
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
                    {submitting ? 'Menyimpan...' : editingId ? 'Kemaskini Soalan' : 'Tambah Soalan'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-md font-bold text-slate-900">
                  Senarai Soalan: <span className="text-blue-700">{selectedBorang}</span>
                </h3>
                <span className="text-xs bg-blue-50 text-blue-800 px-3 py-1 rounded-full font-bold">
                  {soalanList.length} Soalan Ditemui
                </span>
              </div>

              {soalanList.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">Tiada soalan bagi borang "{selectedBorang}". Sila tambah soalan baharu di atas.</p>
              ) : (
                <div className="space-y-3">
                  {soalanList.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{idx + 1}. {q.text}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">{q.kategori}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">{q.jenis}</span>
                        </div>
                        {q.jenis !== 'Subjektif' && (
                          <p className="text-xs text-slate-500">Pilihan: {q.pilihan.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {isAuditForm && (
                          <span className="font-bold text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded">Max: {q.markahMax}m</span>
                        )}
                        <button
                          onClick={() => {
                            setEditingId(q.id);
                            setNewQ({
                              text: q.text,
                              kategori: q.kategori,
                              jenis: q.jenis,
                              pilihan: q.pilihan.join(','),
                              markahMax: q.markahMax
                            });
                          }}
                          className="px-3 py-1 bg-amber-500 text-white rounded font-medium hover:bg-amber-600 flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Adakah anda pasti nak padam soalan ini?')) {
                              await fetch(gasUrl!, {
                                method: 'POST',
                                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                body: JSON.stringify({ action: 'deleteSoalan', id: q.id })
                              });
                              loadAllData();
                            }
                          }}
                          className="px-3 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Padam
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 2. MODUL ODITEE ==================== */}
        {role === 'Oditee' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" /> Profil & Maklumat Mahkamah Oditee
                </h2>
                <span className="text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-600">Sesi Log Masuk Aktif</span>
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
                    value={currentUser?.email || ''}
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
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-slate-900 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 cursor-pointer">
                    <Save className="w-3.5 h-3.5" /> Simpan Profil
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:bg-white print:text-black print:border-b">
                <div>
                  <h2 className="font-bold text-lg">Borang: {selectedBorang}</h2>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Kategori: <span className="text-blue-400 font-bold print:text-black">{profil.hierarki}</span> | Daerah: {profil.daerah}, {profil.negeri}
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 print:hidden cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak / PDF
                </button>
              </div>

              {penilaianOditerForOditee && (
                <div className="p-6 bg-emerald-50 border-b border-emerald-200 space-y-2 print:bg-white print:border-b">
                  <h3 className="font-bold text-sm text-emerald-900">Keputusan & Semakan Oditer:</h3>
                  {isAuditForm && (
                    <p className="text-xs font-semibold text-emerald-800">
                      Jumlah Markah Dinilai: <span className="text-base font-extrabold text-blue-700">{penilaianOditerForOditee.jumlahMarkah}</span> / {penilaianOditerForOditee.markahMax}
                    </p>
                  )}
                  <p className="text-xs text-slate-700">
                    <strong>Ulasan Oditer:</strong> {penilaianOditerForOditee.ulasan || 'Tiada Ulasan'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitJawapan} className="p-6 md:p-8 space-y-8">
                {soalanList.length === 0 ? (
                  <p className="text-center text-slate-500 py-6 text-sm">Tiada soalan bagi borang ini.</p>
                ) : (
                  soalanList.map((q, idx) => (
                    <div key={q.id || idx} className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 print:bg-white print:border-slate-300">
                      <div className="flex items-start justify-between gap-4">
                        <label className="font-semibold text-slate-900 text-sm">
                          {idx + 1}. {q.text}
                        </label>
                        {isAuditForm && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-semibold whitespace-nowrap print:border">
                            Max: {q.markahMax}m
                          </span>
                        )}
                      </div>

                      {q.jenis === 'Objektif' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {(q.pilihan.length > 0 ? q.pilihan : ['Ya', 'Tidak', 'Sebahagian']).map((opt) => (
                            <label key={opt} className={`flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer ${
                              jawapan[q.id] === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium' : 'bg-white border-slate-200 text-slate-700'
                            }`}>
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt}
                                checked={jawapan[q.id] === opt}
                                onChange={(e) => setJawapan({ ...jawapan, [q.id]: e.target.value })}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}

                      {q.jenis === 'Multiple Choice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {q.pilihan.map((opt) => {
                            const isChecked = Array.isArray(jawapan[q.id]) && jawapan[q.id].includes(opt);
                            return (
                              <label key={opt} className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm cursor-pointer ${
                                isChecked ? 'bg-purple-50 border-purple-500 text-purple-900 font-medium' : 'bg-white border-slate-200 text-slate-700'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.jenis === 'Kombinasi' && (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.pilihan.map((opt) => {
                              const selectedOpt = jawapan[q.id]?.pilihan;
                              return (
                                <label key={opt} className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm cursor-pointer ${
                                  selectedOpt === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium' : 'bg-white border-slate-200 text-slate-700'
                                }`}>
                                  <input
                                    type="radio"
                                    name={`q_kombo_${q.id}`}
                                    value={opt}
                                    checked={selectedOpt === opt}
                                    onChange={(e) => handleKombinasiChange(q.id, 'pilihan', e.target.value)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  {opt}
                                </label>
                              );
                            })}
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              Sertakan Penjelasan Lanjut / Huraian (Jika Berkaitan):
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Sertakan penjelasan lanjut..."
                              value={jawapan[q.id]?.huraian || ''}
                              onChange={(e) => handleKombinasiChange(q.id, 'huraian', e.target.value)}
                              className="w-full p-3 rounded-lg border border-slate-300 text-sm bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {q.jenis === 'Subjektif' && (
                        <textarea
                          rows={3}
                          placeholder="Taip huraian jawapan anda di sini..."
                          value={jawapan[q.id] || ''}
                          onChange={(e) => setJawapan({ ...jawapan, [q.id]: e.target.value })}
                          className="w-full p-3 rounded-lg border border-slate-300 text-sm bg-white"
                        />
                      )}
                    </div>
                  ))
                )}

                <div className="pt-4 border-t flex justify-end print:hidden">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-md cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : 'Hantar / Kemaskini Jawapan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== 3. MODUL ODITER & ADMIN ==================== */}
        {(role === 'Oditer' || role === 'Admin') && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
              <h2 className="text-lg font-bold text-slate-900">
                {role === 'Admin' ? 'Modul Semakan & Cetakan Penyerahan (Admin)' : 'Modul Penilaian & Semakan Oditer'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Pilih penyerahan daerah untuk membuat semakan, mencetak borang pemantauan daerah, atau menjana Laporan Pemantauan Gabungan (Lampiran 4).</p>
            </div>

            {/* Jadual Senarai Submisyen Penyerahan */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm print:hidden">
              <div className="p-4 bg-slate-900 text-white font-semibold text-sm flex justify-between items-center">
                <span>Senarai Jawapan Dihantar Mengikut Daerah</span>
                <span className="text-xs bg-slate-800 px-3 py-1 rounded-full">{submissions.length} Penyerahan</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3">Daerah / Negeri</th>
                      <th className="p-3">Borang</th>
                      <th className="p-3">Nama Oditee</th>
                      <th className="p-3">Jumlah Markah</th>
                      <th className="p-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {submissions.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-500">Tiada penyerahan jawapan daerah lagi.</td></tr>
                    ) : (
                      submissions.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{sub.daerah}, {sub.negeri}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{sub.borang || 'Audit Arahan Amalan'}</span></td>
                          <td className="p-3">{sub.nama}</td>
                          <td className="p-3 font-bold">
                            {sub.penilaian ? `${sub.penilaian.jumlahMarkah} / ${sub.penilaian.markahMax}` : 'Belum Dinilai'}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleSelectSubmisyenForAudit(sub)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 cursor-pointer"
                            >
                              Semak & Beri Markah
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PANEL PENILAIAN & SEMAKAN ODITER / ADMIN */}
            {selectedSub && (
              <div className="bg-white rounded-xl border-2 border-blue-500 p-6 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
                
                {/* NAVIGATION TAB & PRINT BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 print:hidden">
                  <div>
                    <h3 className="text-md font-bold text-slate-900">Penilaian Audit: {selectedSub.daerah} ({selectedSub.hierarki})</h3>
                    <p className="text-xs text-slate-500">Borang: {selectedSub.borang} | Oditee: {selectedSub.nama}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setViewTab('semakan')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${viewTab === 'semakan' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      Borang Pemarkahan
                    </button>
                    <button
                      onClick={() => setViewTab('borang_daerah')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${viewTab === 'borang_daerah' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      Borang Pemantauan
                    </button>
                    <button
                      onClick={() => setViewTab('laporan_gabungan')}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${viewTab === 'laporan_gabungan' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    >
                      <FileCheck2 className="w-3.5 h-3.5" /> Laporan Pemantauan (Lampiran 4)
                    </button>
                    <button onClick={handlePrint} className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer">
                      <Printer className="w-4 h-4" /> Cetak / PDF
                    </button>
                  </div>
                </div>

                {/* TAB 1: BORANG SEMAKAN & INPUT ODITER */}
                {viewTab === 'semakan' && (
                  <div className="space-y-6">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-semibold print:hidden">
                      💡 Tandakan kotak semak <strong>"[ / ] Hantar ke Lampiran 4"</strong> pada soalan yang ada penemuan supaya ia dimasukkan secara automatik ke dalam Laporan Pemantauan Gabungan Lampiran 4.
                    </div>

                    <div className="space-y-4">
                      {oditerSoalanList.map((q, idx) => {
                        const ansVal = selectedSub.jawapanJSON ? selectedSub.jawapanJSON[q.id] : null;
                        let formattedAnswer: any = 'Tiada Jawapan';

                        if (ansVal) {
                          if (typeof ansVal === 'object' && !Array.isArray(ansVal)) {
                            formattedAnswer = (
                              <div>
                                <div><strong className="text-blue-700">Pilihan:</strong> {ansVal.pilihan || 'Tiada'}</div>
                                <div className="mt-1"><strong className="text-slate-700">Penjelasan / Huraian:</strong> {ansVal.huraian || 'Tiada Huraian'}</div>
                              </div>
                            );
                          } else if (Array.isArray(ansVal)) {
                            formattedAnswer = ansVal.join(', ');
                          } else {
                            formattedAnswer = String(ansVal);
                          }
                        }

                        return (
                          <div key={q.id || idx} className="p-4 bg-slate-50 rounded-lg border text-xs space-y-3 print:bg-white print:border-slate-300">
                            <div className="font-semibold text-slate-900 text-sm flex justify-between items-center">
                              <span>Soalan {idx + 1}: {q.text}</span>
                              <div className="flex items-center gap-3">
                                {selectedSub.borang === 'Audit Arahan Amalan' && (
                                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold print:border">Max: {q.markahMax}m</span>
                                )}
                                <label className="flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded text-xs font-bold cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={tickedInput[q.id] || false}
                                    onChange={(e) => setTickedInput({ ...tickedInput, [q.id]: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                  />
                                  Hantar ke Lampiran 4
                                </label>
                              </div>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded text-slate-800">
                              <span className="font-bold text-slate-500 block mb-1">Jawapan Dihantar Oditee:</span>
                              <div className="font-semibold text-slate-900">
                                {formattedAnswer !== 'Tiada Jawapan' ? formattedAnswer : <em className="text-slate-400 font-normal">Tiada Jawapan</em>}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                              {selectedSub.borang === 'Audit Arahan Amalan' && (
                                <div>
                                  <label className="font-semibold text-slate-700 block mb-1">Markah (0 - {q.markahMax}):</label>
                                  <input
                                    type="number"
                                    max={q.markahMax}
                                    min={0}
                                    value={markahInput[q.id] ?? 0}
                                    onChange={(e) => setMarkahInput({ ...markahInput, [q.id]: Number(e.target.value) })}
                                    className="w-full p-2 border rounded font-bold text-sm bg-white text-blue-700"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="font-semibold text-slate-700 block mb-1">Arahan Amalan No.:</label>
                                <input
                                  type="text"
                                  value={noAAInput[q.id] || `Soalan ${idx + 1}`}
                                  onChange={(e) => setNoAAInput({ ...noAAInput, [q.id]: e.target.value })}
                                  placeholder="Contoh: AA No. 4 Tahun 2023"
                                  className="w-full p-2 border rounded bg-white text-xs"
                                />
                              </div>
                              <div className={selectedSub.borang === 'Audit Arahan Amalan' ? '' : 'md:col-span-2'}>
                                <label className="font-semibold text-slate-700 block mb-1">Penemuan Pemantauan Dan Bukti:</label>
                                <textarea
                                  rows={2}
                                  value={penemuanBuktiInput[q.id] || ''}
                                  onChange={(e) => setPenemuanBuktiInput({ ...penemuanBuktiInput, [q.id]: e.target.value })}
                                  placeholder="Taip penemuan & bukti pemantauan..."
                                  className="w-full p-2 border rounded bg-white text-xs"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <label className="font-semibold text-slate-700 block mb-1">Catatan / Ulasan Oditer:</label>
                                <textarea
                                  rows={2}
                                  value={catatanInput[q.id] || ''}
                                  onChange={(e) => setCatatanInput({ ...catatanInput, [q.id]: e.target.value })}
                                  placeholder="Taip catatan ringkas jika ada..."
                                  className="w-full p-2 border rounded bg-white text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="pt-2">
                        <label className="font-semibold text-xs text-slate-700">Ulasan Keseluruhan Oditer</label>
                        <textarea
                          rows={3}
                          value={ulasanOditer}
                          onChange={(e) => setUlasanOditer(e.target.value)}
                          placeholder="Masukkan ulasan keseluruhan..."
                          className="w-full mt-1 p-2.5 border rounded-lg text-xs bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t pt-4 print:hidden">
                      {selectedSub.borang === 'Audit Arahan Amalan' ? (
                        <div className="text-sm font-bold text-slate-900">
                          Jumlah Markah: <span className="text-blue-700 text-base">{Object.values(markahInput).reduce((a, b) => Number(a) + Number(b), 0)}</span> / {oditerSoalanList.reduce((a, b) => a + Number(b.markahMax), 0)}
                        </div>
                      ) : <div></div>}
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedSub(null)} className="px-4 py-2 bg-slate-200 rounded text-xs font-semibold text-slate-700 cursor-pointer">Batal</button>
                        <button onClick={handleSavePenilaian} disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 cursor-pointer">
                          {submitting ? 'Menyimpan...' : 'Simpan Penilaian & Catatan'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BORANG PEMANTAUAN PEMATUHAN ARAHAN AMALAN DAERAH */}
                {viewTab === 'borang_daerah' && (
                  <div className="p-6 bg-white space-y-6 text-slate-900 text-xs font-sans print:p-0">
                    <div className="text-center space-y-1 border-b pb-4">
                      <h2 className="font-extrabold text-base tracking-wide uppercase">BORANG PEMANTAUAN PEMATUHAN ARAHAN AMALAN</h2>
                    </div>

                    <div className="space-y-1 text-xs font-semibold max-w-lg">
                      <div className="grid grid-cols-3">
                        <span>Nama Auditor</span>
                        <span className="col-span-2">: <strong className="border-b border-slate-900 px-2">{namaKetuaPemantau || '.........................................................'}</strong></span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span>Nama Auditee</span>
                        <span className="col-span-2">: <strong className="border-b border-slate-900 px-2">{selectedSub.nama}</strong></span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span>Tarikh Audit</span>
                        <span className="col-span-2">: <strong className="border-b border-slate-900 px-2">{new Date(selectedSub.tarikh).toLocaleDateString()}</strong></span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span>Lokasi Audit</span>
                        <span className="col-span-2">: <strong className="border-b border-slate-900 px-2">{selectedSub.daerah}, {selectedSub.negeri} ({selectedSub.hierarki})</strong></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-900 text-xs text-left">
                        <thead>
                          <tr className="bg-blue-200 text-slate-900 border-b border-slate-900 text-center font-bold">
                            <th className="border border-slate-900 p-2 w-10">BIL</th>
                            <th className="border border-slate-900 p-2 w-48">ARAHAN AMALAN NO.</th>
                            <th className="border border-slate-900 p-2">PENEMUAN PEMANTAUAN DAN BUKTI</th>
                            <th className="border border-slate-900 p-2 w-48">CATATAN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oditerSoalanList.map((q, idx) => (
                            <tr key={q.id || idx} className="border-b border-slate-900">
                              <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                              <td className="border border-slate-900 p-2 font-semibold">
                                {noAAInput[q.id] || `Soalan ${idx + 1}`}
                              </td>
                              <td className="border border-slate-900 p-2 whitespace-pre-wrap">
                                {penemuanBuktiInput[q.id] || 'Tiada penemuan direkodkan'}
                              </td>
                              <td className="border border-slate-900 p-2 whitespace-pre-wrap">
                                {catatanInput[q.id] || 'Tiada catatan'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: LAPORAN PEMANTAUAN GABUNGAN NEGERI (LAMPIRAN 4) */}
                {viewTab === 'laporan_gabungan' && (
                  <div className="p-4 bg-white space-y-6 text-slate-900 text-xs font-sans print:p-0">
                    
                    {/* FILTER DAERAH UNTUK DIGABUNGKAN */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 print:hidden">
                      <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-700" /> Pilih Daerah Untuk Digabungkan Dalam Laporan Lampiran 4 (Negeri: {selectedSub.negeri})
                      </h4>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {sameStateSubmissions.map((s, i) => (
                          <label key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 border rounded-lg font-bold text-xs cursor-pointer shadow-sm">
                            <input
                              type="checkbox"
                              checked={selectedMultiDaerah.includes(s.daerah)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMultiDaerah([...selectedMultiDaerah, s.daerah]);
                                } else {
                                  setSelectedMultiDaerah(selectedMultiDaerah.filter(d => d !== s.daerah));
                                }
                              }}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            {s.daerah} ({s.nama})
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="text-center space-y-1 border-b pb-4">
                      <p className="font-bold text-right text-[10px]">LAMPIRAN 4</p>
                      <h2 className="font-extrabold text-sm uppercase tracking-wide">PEMANTAUAN PEMATUHAN ARAHAN AMALAN</h2>
                      <h3 className="font-bold text-xs uppercase">JABATAN KEHAKIMAN SYARIAH NEGERI / MAHKAMAH SYARIAH NEGERI {selectedSub.negeri?.toUpperCase()}</h3>
                      <h4 className="font-bold text-xs underline">LAPORAN PEMANTAUAN GABUNGAN</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold">
                      <div>
                        <span>JKSN/MSN : </span>
                        <span className="font-bold text-blue-900 px-1 uppercase">
                          {selectedSub.negeri} ({selectedMultiDaerah.join(', ')})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Tarikh Pemantauan : </span>
                        <input
                          type="date"
                          value={tarikhPemantauan}
                          onChange={(e) => setTarikhPemantauan(e.target.value)}
                          className="p-1 border rounded text-xs font-bold bg-slate-50 border-slate-300 print:bg-transparent print:border-none"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold leading-relaxed">
                        1. Berdasarkan pemantauan yang dijalankan di JKSN/MSN Negeri <strong className="underline uppercase">{selectedSub.negeri}</strong> (Daerah: {selectedMultiDaerah.join(', ')}) terhadap Arahan Amalan. Terdapat beberapa Arahan Amalan yang tidak dipatuhi sebagaimana berikut:
                      </p>
                    </div>

                    {/* JADUAL HIMPUNAN PENEMUAN YANG DI-TICK */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-900 text-xs text-left">
                        <thead>
                          <tr className="bg-cyan-100 text-slate-900 border-b border-slate-900 text-center font-bold">
                            <th className="border border-slate-900 p-2 w-10">No.</th>
                            <th className="border border-slate-900 p-2 w-28">Lokasi</th>
                            <th className="border border-slate-900 p-2 w-[30%]">Arahan Amalan</th>
                            <th className="border border-slate-900 p-2">Penemuan Pemantauan</th>
                            <th className="border border-slate-900 p-2">Sebab Ketidakpatuhan / Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aggregatedTickedItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                                Tiada item penemuan yang di-tick untuk dimasukkan ke Lampiran 4. Sila tandakan kotak semak "[ / ] Hantar ke Lampiran 4" dalam Borang Semakan.
                              </td>
                            </tr>
                          ) : (
                            aggregatedTickedItems.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-900">
                                <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                                <td className="border border-slate-900 p-2 font-semibold uppercase">{item.daerah}, {item.negeri}</td>
                                <td className="border border-slate-900 p-2 font-bold">{item.noAA}</td>
                                <td className="border border-slate-900 p-2 whitespace-pre-wrap">{item.penemuanBukti}</td>
                                <td className="border border-slate-900 p-2 whitespace-pre-wrap">{item.catatan || item.sebab}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 space-y-8">
                      <p className="font-semibold">Oleh itu, Ketua Jabatan diminta mengambil perhatian terhadap pematuhan Arahan Amalan berkaitan.</p>

                      <div className="grid grid-cols-2 gap-12 pt-8 text-center">
                        <div className="space-y-3">
                          <p className="font-bold">Tandatangan Ketua Pemantau</p>
                          <div className="pt-8">
                            <p className="border-b border-slate-900 w-56 mx-auto mb-1"></p>
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-semibold">(Nama:</span>
                              <input
                                type="text"
                                value={namaKetuaPemantau}
                                onChange={(e) => setNamaKetuaPemantau(e.target.value)}
                                placeholder="Taip nama Oditer..."
                                className="p-0.5 border-b border-dotted font-bold text-center text-xs bg-slate-50 print:bg-transparent print:border-none focus:outline-none"
                              />
                              <span className="font-semibold">)</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="font-bold">Tandatangan Ketua Jabatan / Wakil</p>
                          <div className="pt-8">
                            <p className="border-b border-slate-900 w-56 mx-auto mb-1"></p>
                            <p className="font-semibold">(Nama: ...................................................)</p>
                            <p className="text-[10px] text-slate-500 mt-1">Cop Jabatan</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>

      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-center text-xs print:hidden">
        {settings.footerText || '@2026, DIY Audit Arahan Amalan JKSM'}
      </footer>
    </div>
  );
}