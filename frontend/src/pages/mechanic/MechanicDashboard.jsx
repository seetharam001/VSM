import { useEffect, useState } from 'react';
import { mechanicApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Spinner, StatusBadge } from '../../components/common';
import { Link } from 'react-router-dom';

export default function MechanicDashboard() {
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const dashRes = await mechanicApi.getDashboard();
        const { mechanic, stats } = dashRes.data.data;
        setData({ mechanic, stats });
        const jobsRes = await mechanicApi.getBookings(mechanic.id, { limit: 5 });
        setJobs(jobsRes.data.data);
      } catch (err) {
        console.error('Failed to load mechanic dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardLayout title="Mechanic Dashboard"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Mechanic Dashboard">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 4 }}>Welcome, {data?.mechanic?.name}! 👋</h2>
        <p style={{ color: 'var(--text-muted)' }}>Specialization: {data?.mechanic?.specialization || 'General'} · {data?.mechanic?.experience} years exp.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📋" value={data?.stats?.assigned || 0} label="Total Assigned" variant="primary" />
        <StatCard icon="⏳" value={data?.stats?.pending || 0} label="Pending Jobs" variant="accent" />
        <StatCard icon="✅" value={data?.stats?.completed || 0} label="Completed" variant="success" />
        <StatCard icon="📅" value={data?.stats?.todayJobs || 0} label="Today's Jobs" variant="secondary" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔧 Recent Jobs</h3>
          <Link to="/mechanic/jobs" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        {jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <div className="empty-state-title">No jobs assigned yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)', marginRight: 12 }}>{b.bookingNumber}</span>
                  <span style={{ fontWeight: 600 }}>{b.service?.name}</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                    {b.customer?.name} · {b.vehicle?.registrationNumber} · {new Date(b.preferredDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
