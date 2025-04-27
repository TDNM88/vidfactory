import { useEffect, useState } from 'react';
import axios from 'axios';
import RouteGuard from '../components/RouteGuard';

export default function ProfilePage() {
  return (
    <RouteGuard>
      <ProfilePageContent />
    </RouteGuard>
  );
}

function ProfilePageContent() {

  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchProfile(token);
    fetchLogs(token);
  }, []);

  async function fetchProfile(token: string) {
    setLoading(true);
    try {
      const res = await axios.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      setUser((res.data as any).user);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Lỗi khi tải thông tin user');
    }
    setLoading(false);
  }

  async function fetchLogs(token: string) {
    try {
      const res = await axios.get('/api/credit-log', { headers: { Authorization: `Bearer ${token}` } });
      setLogs((res.data as any).logs);
    } catch {}
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', fontFamily: 'sans-serif' }}>Đang tải...</div>
  );

  return (
    <RouteGuard>
      <div style={{ padding: 32, fontFamily: 'sans-serif', background: '#f9f9fb', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#2b2d42' }}>Thông tin đại lý</h1>
          <button style={{ background: '#e63946', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }} onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>Đăng xuất</button>
        </div>
        {loading && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>Đang xử lý...</div></div>}
        {error && <div style={{ color: '#e63946', background: '#fff3f3', border: '1px solid #e63946', padding: 8, borderRadius: 4, marginBottom: 16 }}>{error}</div>}
        <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #0001', maxWidth: 480, marginBottom: 32 }}>
          <div><b>Username:</b> {user.username}</div>
          <div><b>Brand:</b> {user.brandName}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Credit:</b> <span style={{ color: user.credit > 0 ? '#06d6a0' : '#e63946', fontWeight: 600 }}>{user.credit}</span></div>
          <div><b>Logo:</b> {user.logoUrl && <img src={user.logoUrl} alt="logo" width={64} style={{ borderRadius: 8, marginTop: 8 }} />}</div>
        </div>
        <h2 style={{ color: '#457b9d' }}>Lịch sử credit</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
            <thead style={{ background: '#22223b', color: '#fff' }}>
              <tr>
                <th>ID</th>
                <th>Delta</th>
                <th>Action</th>
                <th>Note</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {logs.filter((l:any) => l.user?.id === user.id).map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{l.id}</td>
                  <td>{l.delta}</td>
                  <td>{l.action}</td>
                  <td>{l.note}</td>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RouteGuard>
  );
}
