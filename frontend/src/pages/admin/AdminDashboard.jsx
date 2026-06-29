import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Spinner, EmptyState } from '../../components/common';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [topMechanics, setTopMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getMonthlyReport(),
      adminApi.getPopularServices(),
      adminApi.getTopMechanics(),
    ]).then(([statsRes, monthlyRes, servicesRes, mechanicsRes]) => {
      setStats(statsRes.data.data);
      // Process monthly data
      const revenueMap = {};
      (monthlyRes.data.data.revenue || []).forEach(r => { revenueMap[r.month] = r.revenue; });
      const bookingMap = {};
      (monthlyRes.data.data.bookings || []).forEach(b => {
        if (!bookingMap[b.month]) bookingMap[b.month] = { month: b.month, total: 0 };
        bookingMap[b.month].total += parseInt(b.total);
      });
      const combined = Object.keys({ ...revenueMap, ...bookingMap }).sort().map(month => ({
        month: month.slice(5),
        revenue: revenueMap[month] || 0,
        bookings: bookingMap[month]?.total || 0,
      }));
      setMonthlyData(combined);
      setPopularServices(servicesRes.data.data);
      setTopMechanics(mechanicsRes.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Admin Dashboard"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="👥" value={stats?.customers || 0} label="Total Customers" variant="primary" />
        <StatCard icon="🔧" value={stats?.mechanics || 0} label="Mechanics" variant="secondary" />
        <StatCard icon="🚗" value={stats?.vehicles || 0} label="Registered Vehicles" variant="success" />
        <StatCard icon="⚙️" value={stats?.services || 0} label="Active Services" variant="accent" />
        <StatCard icon="📅" value={stats?.totalBookings || 0} label="Total Bookings" variant="primary" />
        <StatCard icon="⏳" value={stats?.pendingBookings || 0} label="Pending Bookings" variant="accent" />
        <StatCard icon="✅" value={stats?.completedBookings || 0} label="Completed" variant="success" />
        <StatCard icon="💰" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} label="Total Revenue" variant="secondary" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly Revenue */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Monthly Revenue & Bookings</h3>
          </div>
          {monthlyData.length === 0 ? (
            <EmptyState icon="📊" title="No data yet" />
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue (₹)" />
                  <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={false} name="Bookings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Popular Services */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏆 Popular Services</h3>
          </div>
          {popularServices.length === 0 ? (
            <EmptyState icon="⚙️" title="No data yet" />
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={popularServices} dataKey="bookings" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                    {popularServices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Mechanics */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔧 Top Mechanics by Completed Jobs</h3>
        </div>
        {topMechanics.length === 0 ? (
          <EmptyState icon="🔧" title="No completed jobs yet" />
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMechanics} margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="completedJobs" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
