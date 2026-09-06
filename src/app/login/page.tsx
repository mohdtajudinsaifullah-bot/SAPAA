'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    nama: '',
    no_telefon: '',
    hierarki: 'MRS',
    negeri: '',
    daerah: ''
  });

  const router = useRouter();
  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gasUrl) {
      alert('Ralat: URL Google Apps Script (NEXT_PUBLIC_GAS_URL) tidak dijumpai dalam tetapan Vercel.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: isRegister ? 'register' : 'login',
          email: form.email,
          password: form.password,
          nama: form.nama,
          noTel: form.no_telefon,
          no_telefon: form.no_telefon,
          hierarki: form.hierarki,
          negeri: form.negeri,
          daerah: form.daerah
        })
      });

      const data = await res.json();

      if (data && data.success) {
        if (!isRegister) {
          // Simpan sesi log masuk ke localStorage
          localStorage.setItem('user_session', JSON.stringify(data.user));
          alert('Log masuk berjaya!');
          router.push('/dashboard');
        } else {
          alert('Pendaftaran berjaya! Sila log masuk.');
          setIsRegister(false);
        }
      } else {
        alert(data?.message || 'Gagal memproses permintaan. Sila semak emel/kata laluan.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Ralat sambungan rangkaian ke Google Sheets. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          {isRegister ? 'Daftar Akaun Baharu' : 'Log Masuk Ke SAPAA JKSM'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700">Emel Rasmi</label>
            <input
              type="email"
              required
              placeholder="nama@esyariah.gov.my"
              className="w-full p-2.5 border rounded-lg mt-1 text-sm bg-slate-50"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Kata Laluan</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full p-2.5 border rounded-lg mt-1 text-sm bg-slate-50"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="font-semibold text-slate-700">Nama Penuh</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Penuh Pegawai"
                  className="w-full p-2.5 border rounded-lg mt-1 text-sm bg-slate-50"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">No. Telefon</label>
                <input
                  type="text"
                  required
                  placeholder="012-3456789"
                  className="w-full p-2.5 border rounded-lg mt-1 text-sm bg-slate-50"
                  value={form.no_telefon}
                  onChange={(e) => setForm({ ...form, no_telefon: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Hierarki Mahkamah</label>
                <select
                  value={form.hierarki}
                  onChange={(e) => setForm({ ...form, hierarki: e.target.value })}
                  className="w-full p-2.5 border rounded-lg mt-1 text-sm font-medium bg-slate-50"
                >
                  <option value="MRS">MRS (Mahkamah Rendah Syariah)</option>
                  <option value="MTS">MTS (Mahkamah Tinggi Syariah)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Negeri</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SELANGOR"
                    className="w-full p-2.5 border rounded-lg mt-1 text-sm bg-slate-50"
                    value={form.negeri}
                    onChange={(e) => setForm({ ...form, negeri: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Daerah</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BANGI"
                    className="w-full p-2.5 border rounded-lg mt-1 text-sm bg-slate-50"
                    value={form.daerah}
                    onChange={(e) => setForm({ ...form, daerah: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition cursor-pointer"
          >
            {loading ? 'Sila tunggu...' : isRegister ? 'Daftar' : 'Log Masuk'}
          </button>
        </form>

        <div className="text-center text-xs">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-700 font-semibold underline cursor-pointer"
          >
            {isRegister ? 'Sudah ada akaun? Log Masuk' : 'Belum ada akaun? Daftar Sini'}
          </button>
        </div>
      </div>
    </div>
  );
}