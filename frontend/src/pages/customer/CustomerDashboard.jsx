import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Spinner, StatusBadge } from '../../components/common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CustomerDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingApi.getCustomerDashboard(),
      bookingApi.getAll({ limit: 5 }),
    ]).then(([statsRes, bookingsRes]) => {
      setStats(statsRes.data.data);
      setRecentBookings(bookingsRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="My Dashboard"><Spinner /></DashboardLayout>;

  // Chart data from bookings
  const statusCounts = recentBookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({ status: status.replace(' ', '\n'), count }));

  return (
    <DashboardLayout title="My Dashboard">
      <div className="stats-grid">
        <StatCard icon="🚗" value={stats?.vehicles || 0} label="My Vehicles" variant="primary" />
        <StatCard icon="📅" value={stats?.activeBookings || 0} label="Active Bookings" variant="secondary" />
        <StatCard icon="✅" value={stats?.completedBookings || 0} label="Completed Services" variant="success" />
        <StatCard icon="💳" value={stats?.pendingPayments || 0} label="Pending Payments" variant="accent" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 Recent Bookings</h3>
            <Link to="/customer/bookings" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">No bookings yet</div>
              <div className="empty-state-desc">Book your first service to get started</div>
              <Link to="/customer/bookings" className="btn btn-primary mt-4">Book Service</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.bookingNumber}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{b.service?.name} — {b.vehicle?.registrationNumber}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(b.preferredDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { to: '/customer/bookings', icon: '📅', label: 'Book a Service', desc: 'Schedule vehicle service' },
              { to: '/customer/vehicles', icon: '🚗', label: 'Add Vehicle', desc: 'Register a new vehicle' },
              { to: '/customer/invoices', icon: '🧾', label: 'View Invoices', desc: 'Download & pay invoices' },
              { to: '/customer/feedback', icon: '💬', label: 'Submit Feedback', desc: 'Share your experience' },
            ].map(item => (
              <Link key={item.to} to={item.to} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)', transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              >
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
