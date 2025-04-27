import { useEffect, useState } from 'react';
import axios from 'axios';
import RouteGuard from '../components/RouteGuard';

export default function AdminPage() {
  return (
    <RouteGuard adminOnly>
      <AdminPageContent />
    </RouteGuard>
  );
}

function AdminPageContent() {

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [credit, setCredit] = useState(0);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div style={{ padding: 32, fontFamily: 'sans-serif', background: '#f9f9fb', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#2b2d42' }}>Admin: Quản lý đại lý</h1>
          <button style={{ background: '#e63946', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }} onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>Đăng xuất</button>
        </div>
        {loading && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>Đang xử lý...</div></div>}
        {error && <div style={{ color: '#e63946', background: '#fff3f3', border: '1px solid #e63946', padding: 8, borderRadius: 4, marginBottom: 16 }}>{error}</div>}
        <h2 style={{ color: '#457b9d' }}>Danh sách user/đại lý</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
            <thead style={{ background: '#457b9d', color: '#fff' }}>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Brand</th>
                <th>Email</th>
                <th>Credit</th>
                <th>Logo</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.brandName}</td>
                  <td>{u.email}</td>
                  <td>{u.credit}</td>
                  <td>{u.logoUrl && <img src={u.logoUrl} alt="logo" width={32} style={{ borderRadius: 4 }} />}</td>
                  <td>
                    <button style={{ marginRight: 4, background: '#06d6a0', color: '#222', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }} onClick={() => handleCredit(u.id, 10)}>+10</button>
                    <button style={{ marginRight: 4, background: '#ffd166', color: '#222', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }} onClick={() => handleCredit(u.id, -10)}>-10</button>
                    <input style={{ marginRight: 4, border: '1px solid #ccc', borderRadius: 4, padding: '2px 4px', width: 90 }} placeholder="Mật khẩu mới" value={password} onChange={e => setPassword(e.target.value)} />
                    <button style={{ marginRight: 4, background: '#457b9d', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }} onClick={() => handleResetPassword(u.id)}>Reset mật khẩu</button>
                    <button style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }} onClick={() => handleDeleteUser(u.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 style={{ color: '#457b9d', marginTop: 32 }}>Lịch sử credit</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
            <thead style={{ background: '#22223b', color: '#fff' }}>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Brand</th>
                <th>Delta</th>
                <th>Action</th>
                <th>Note</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{l.id}</td>
                  <td>{l.user?.username}</td>
                  <td>{l.user?.brandName}</td>
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
