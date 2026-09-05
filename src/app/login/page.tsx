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
    setLoading(true);

    try {
      const res = await fetch(gasUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: isRegister ? 'register' : 'login',
          ...form
        })
      });

      const data = await res.json();

      if (data.success) {
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
        alert(data.message);
      }
    } catch (err) {
      alert('Ralat sistem, sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          {isRegister ? 'Daftar Akaun Baharu' : 'Log Masuk DIY SAPAA'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700">Emel Rasmi</label>
            <input
              type="email"
              required
              className="w-full p-2.5 border rounded-lg mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Kata Laluan</label>
            <input
              type="password"
              required
              className="w-full p-2.5 border rounded-lg mt-1"
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
                  className="w-full p-2.5 border rounded-lg mt-1"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">No. Telefon</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg mt-1"
                  value={form.no_telefon}
                  onChange={(e) => setForm({ ...form, no_telefon: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Negeri</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border rounded-lg mt-1"
                    value={form.negeri}
                    onChange={(e) => setForm({ ...form, negeri: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Daerah</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border rounded-lg mt-1"
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
            className="w-full py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition"
          >
            {loading ? 'Sila tunggu...' : isRegister ? 'Daftar' : 'Log Masuk'}
          </button>
        </form>

        <div className="text-center text-xs">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-700 font-semibold underline"
          >
            {isRegister ? 'Sudah ada akaun? Log Masuk' : 'Belum ada akaun? Daftar Sini'}
          </button>
        </div>
      </div>
    </div>
  );
}