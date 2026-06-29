import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Spinner } from '../../components/common';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminReports() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [topMechanics, setTopMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getMonthlyReport(),
      adminApi.getPopularServices(),
      adminApi.getTopMechanics(),
    ]).then(([monthly, services, mechanics]) => {
      const revenueMap = {};
      (monthly.data.data.revenue || []).forEach(r => { revenueMap[r.month] = parseFloat(r.revenue) || 0; });
      const bookingMap = {};
      (monthly.data.data.bookings || []).forEach(b => {
        if (!bookingMap[b.month]) bookingMap[b.month] = 0;
        bookingMap[b.month] += parseInt(b.total);
      });
      const combined = Object.keys({ ...revenueMap, ...bookingMap }).sort().map(m => ({
        month: m.slice(5), revenue: revenueMap[m] || 0, bookings: bookingMap[m] || 0,
      }));
      setMonthlyData(combined);
      setPopularServices(services.data.data);
      setTopMechanics(mechanics.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Reports"><Spinner /></DashboardLayout>;

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = monthlyData.reduce((s, d) => s + d.bookings, 0);

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: '💰', value: `₹${totalRevenue.toLocaleString()}`, label: 'Total Revenue (Year)', variant: 'success' },
          { icon: '📅', value: totalBookings, label: 'Total Bookings (Year)', variant: 'primary' },
          { icon: '🏆', value: popularServices[0]?.name || '—', label: 'Most Popular Service', variant: 'accent' },
          { icon: '🔧', value: topMechanics[0]?.name || '—', label: 'Top Mechanic', variant: 'secondary' },
        ].map(c => (
          <div key={c.label} className={`stat-card ${c.variant}`}>
            <div className={`stat-icon ${c.variant}`}>{c.icon}</div>
            <div><div className="stat-value" style={{ fontSize: '1.3rem' }}>{c.value}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">📈 Monthly Revenue</h3></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={v => `₹${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">📅 Monthly Bookings</h3></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">⚙️ Popular Services</h3></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Rank</th><th>Service</th><th>Bookings</th></tr></thead>
              <tbody>
                {popularServices.map((s, i) => (
                  <tr key={s.name}>
                    <td>{i + 1 === 1 ? '🥇' : i + 1 === 2 ? '🥈' : i + 1 === 3 ? '🥉' : i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🔧 Top Mechanics</h3></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Rank</th><th>Mechanic</th><th>Completed</th></tr></thead>
              <tbody>
                {topMechanics.map((m, i) => (
                  <tr key={m.name}>
                    <td>{i + 1 === 1 ? '🥇' : i + 1 === 2 ? '🥈' : i + 1 === 3 ? '🥉' : i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.completedJobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
