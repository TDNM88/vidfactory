"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { GlassCard } from '@/components/ui-custom/glass-card';
import { GradientButton } from '@/components/ui-custom/gradient-button';
import RouteGuard from '@/components/RouteGuard';

import { useRouter } from 'next/navigation';
import { useUserStatus } from '@/components/UserStatusContext';

export default function AdminPage() {

  type User = {
    id: number;
    username: string;
    brandName?: string;
    email?: string;
    credit: number;
    logoUrl?: string;
    isAdmin?: boolean;
  };
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [credit, setCredit] = useState(0);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { setUser } = useUserStatus();

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) setToken(t);
    fetchUsers(t);
    fetchLogs(t);
  }, []);

  async function fetchUsers(token: string|null) {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers((res.data as any).users);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Lỗi khi tải user');
    }
    setLoading(false);
  }

  async function fetchLogs(token: string|null) {
    if (!token) return;
    try {
      const res = await axios.get('/api/credit-log', { headers: { Authorization: `Bearer ${token}` } });
      setLogs((res.data as any).logs);
    } catch {}
  }

  async function handleCredit(userId: number, delta: number) {
    setLoading(true);
    try {
      await axios.post('/api/credit', { delta, action: 'admin_adjust', note: 'Admin cấp credit' }, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers(token);
      fetchLogs(token);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Lỗi khi cấp credit');
    }
    setLoading(false);
  }

  async function handleResetPassword(userId: number) {
    if (!password) return;
    setLoading(true);
    try {
      await axios.post('/api/reset-password', { id: userId, password }, { headers: { Authorization: `Bearer ${token}` } });
      setPassword('');
      alert('Đã reset mật khẩu');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Lỗi khi reset mật khẩu');
    }
    setLoading(false);
  }

  async function handleDeleteUser(userId: number) {
    if (!window.confirm('Xóa user này?')) return;
    setLoading(true);
    try {
      await axios.request({ url: '/api/users', method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, data: { id: userId } });
      fetchUsers(token);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Lỗi khi xóa user');
    }
    setLoading(false);
  }

  return (
    <RouteGuard adminOnly>
      <div className="min-h-screen bg-white-100 flex flex-col items-center justify-start py-8 px-2 md:px-0">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
  <h1 className="text-2xl md:text-3xl font-bold text-[hsl(160,83%,28%)]">Admin: Quản lý đại lý</h1>
</div>
          {loading && (
            <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl text-lg font-semibold flex items-center gap-2">
                <span className="animate-spin h-6 w-6 border-4 border-teal-400 border-t-transparent rounded-full mr-3"></span>
                Đang xử lý...
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded-xl mb-2">
              {error}
            </div>
          )}
          {/* Bảng thông tin user/đại lý */}
          <GlassCard className="w-full p-4 md:p-8 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold text-[hsl(174,84%,50%)] mb-4">Danh sách user/đại lý</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow border-separate border-spacing-0 overflow-hidden">
                <thead className="bg-gradient-to-r from-[hsl(160,83%,28%)] to-[hsl(174,84%,50%)] text-white">
                  <tr>
                    <th className="py-3 px-2 font-semibold text-base">ID</th>
                    <th className="py-3 px-2 font-semibold text-base">Username</th>
                    <th className="py-3 px-2 font-semibold text-base">Brand</th>
                    <th className="py-3 px-2 font-semibold text-base">Email</th>
                    <th className="py-3 px-2 font-semibold text-base">Credit</th>
                    <th className="py-3 px-2 font-semibold text-base">Logo</th>
                    <th className="py-3 px-2 font-semibold text-base">Admin</th>
                    <th className="py-3 px-2 font-semibold text-base">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: User) => (
                    <tr key={u.id} className="border-b last:border-b-0 hover:bg-teal-50 transition">
                      <td className="py-2 px-2 text-center">{u.id}</td>
                      <td className="py-2 px-2 font-medium">{u.username}</td>
                      <td className="py-2 px-2">{u.brandName}</td>
                      <td className="py-2 px-2">{u.email}</td>
                      <td className="py-2 px-2 flex items-center gap-2">
                        <input
                          type="number"
                          value={selectedUser?.id === u.id ? credit : u.credit}
                          onFocus={() => { setSelectedUser(u); setCredit(u.credit); }}
                          onChange={e => setCredit(Number(e.target.value))}
                          className="w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-[hsl(174,84%,50%)] outline-none text-base"
                          min={0}
                        />
                        <GradientButton
                          className="px-3 py-1 text-sm rounded-lg"
                          onClick={() => handleCredit(u.id, credit - u.credit)}
                          disabled={selectedUser?.id !== u.id || credit === u.credit}
                        >
                          Cộng
                        </GradientButton>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {u.logoUrl && <img src={u.logoUrl} alt="logo" className="w-10 h-10 object-cover rounded" />}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {u.isAdmin ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">✔️</span>
                        ) : ''}
                      </td>
                      <td className="py-2 px-2 flex flex-col md:flex-row gap-2 justify-center items-center">
                        <input
                          type="text"
                          placeholder="Mật khẩu mới"
                          value={selectedUser?.id === u.id ? password : ''}
                          onFocus={() => setSelectedUser(u)}
                          onChange={e => setPassword(e.target.value)}
                          className="w-28 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-[hsl(174,84%,50%)] outline-none text-sm"
                        />
                        <GradientButton
                          className="px-3 py-1 text-sm rounded-lg"
                          onClick={() => handleResetPassword(u.id)}
                          disabled={selectedUser?.id !== u.id || !password}
                        >
                          Reset mật khẩu
                        </GradientButton>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm shadow"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
          <GlassCard className="w-full p-4 md:p-8 shadow-lg mt-8">
            <h2 className="text-xl md:text-2xl font-bold text-[hsl(174,84%,50%)] mb-4">Lịch sử credit</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow border-separate border-spacing-0 overflow-hidden">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
                  <tr>
                    <th className="py-3 px-2 font-semibold text-base">ID</th>
                    <th className="py-3 px-2 font-semibold text-base">User</th>
                    <th className="py-3 px-2 font-semibold text-base">Brand</th>
                    <th className="py-3 px-2 font-semibold text-base">Delta</th>
                    <th className="py-3 px-2 font-semibold text-base">Action</th>
                    <th className="py-3 px-2 font-semibold text-base">Note</th>
                    <th className="py-3 px-2 font-semibold text-base">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l: any) => (
                    <tr key={l.id} className="border-b last:border-b-0 hover:bg-teal-50 transition">
                      <td className="py-2 px-2 text-center">{l.id}</td>
                      <td className="py-2 px-2">{l.user?.username}</td>
                      <td className="py-2 px-2">{l.user?.brandName}</td>
                      <td className="py-2 px-2 text-center">{l.delta}</td>
                      <td className="py-2 px-2">{l.action}</td>
                      <td className="py-2 px-2">{l.note}</td>
                      <td className="py-2 px-2 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </RouteGuard>
  );
}
