"use client";
import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth', { username, password });
      localStorage.setItem('token', (res.data as any).token);
      window.location.href = (res.data as any).user.isAdmin ? '/admin' : '/dashboard';
    } catch (e: any) {
      setError(e.response?.data?.error || 'Lỗi đăng nhập');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#f1f3f8] to-[#e0f7fa] font-sans px-2">

      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-xl px-8 py-10 w-full max-w-md flex flex-col gap-4 border border-gray-100 animate-fade-in"
        autoComplete="off"
      >
        <div className="flex flex-col items-center mb-4">
          <div className="mb-2">
            <Image src="/logo.png" alt="TDNM logo" width={56} height={56} className="rounded-full" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary mb-1 drop-shadow">Đăng nhập hệ thống</h1>
          <span className="text-gray-500 text-sm text-center">Trải nghiệm sản xuất video AI hiện đại, bảo mật, cá nhân hóa</span>
        </div>
        <input
          placeholder="Tên đăng nhập"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base mb-2 transition-all bg-gray-50"
        />
        <input
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base mb-2 transition-all bg-gray-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-teal-400 text-white font-bold py-3 rounded-lg mt-2 shadow-md hover:scale-105 transition-transform text-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-center mt-2 animate-shake">
            {error}
          </div>
        )}
      </form>
      <div className="w-full max-w-md text-xs text-gray-500 text-center mt-4 select-none">
        <div>Ứng dụng được phát triển bởi <span className="font-semibold text-primary">TDNM</span></div>
        <div>Liên hệ: <a href="mailto:aigc.tdnm@gmail.com" className="underline hover:text-primary">aigc.tdnm@gmail.com</a> hoặc <a href="tel:0984519098" className="underline hover:text-primary">0984 519 098</a></div>
      </div>
    </div>
  );
}
