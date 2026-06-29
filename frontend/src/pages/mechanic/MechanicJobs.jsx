import { useState, useEffect } from 'react';
import { mechanicApi, bookingApi } from '../../api';
import { useAuthStore } from '../../store';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, Spinner, EmptyState, Pagination, Modal } from '../../components/common';
import { toast } from 'react-toastify';

const MECHANIC_STATUS_OPTIONS = {
  'Mechanic Assigned': ['Inspection Started'],
  'Inspection Started': ['Repair In Progress'],
  'Repair In Progress': ['Waiting for Parts', 'Completed'],
  'Waiting for Parts': ['Repair In Progress', 'Completed'],
};

const NOTE_TYPES = ['inspection', 'repair', 'parts', 'general'];

export default function MechanicJobs() {
  const { user } = useAuthStore();
  const [mechanicId, setMechanicId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState({ noteType: 'inspection', content: '', estimatedCompletion: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mechanicApi.getDashboard().then(r => {
      const id = r.data.data.mechanic.id;
      setMechanicId(id);
    });
  }, []);

  useEffect(() => {
    if (mechanicId) fetchJobs();
  }, [mechanicId, page, filterStatus]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await mechanicApi.getBookings(mechanicId, { page, limit: 10, status: filterStatus || undefined });
      setJobs(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      await bookingApi.updateStatus(jobId, { status: newStatus });
      toast.success(`Status updated to "${newStatus}"`);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAddNote = async () => {
    if (!note.content.trim()) return;
    setSaving(true);
    try {
      await bookingApi.addRepairNote(selectedJob.id, note);
      toast.success('Note added!');
      setShowNote(false);
      setNote({ noteType: 'inspection', content: '', estimatedCompletion: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally { setSaving(false); }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout title="My Jobs">
      <div className="filters-bar">
        <select className="form-control" style={{ width: 240 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Jobs</option>
          {['Mechanic Assigned', 'Inspection Started', 'Repair In Progress', 'Waiting for Parts', 'Completed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={() => { setFilterStatus(''); setPage(1); }}>Reset</button>
      </div>

      {loading ? <Spinner /> : jobs.length === 0 ? (
        <EmptyState icon="🔧" title="No jobs assigned" description="Jobs will appear here when admin assigns them to you" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map(b => (
            <div key={b.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)', marginRight: 12 }}>{b.bookingNumber}</span>
                  <StatusBadge status={b.status} />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  📅 {new Date(b.preferredDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Customer</div><div style={{ fontWeight: 600 }}>{b.customer?.name}</div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Vehicle</div><div style={{ fontWeight: 600 }}>{b.vehicle?.brand} {b.vehicle?.model}</div><div style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>{b.vehicle?.registrationNumber}</div></div>
                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Service</div><div style={{ fontWeight: 600 }}>{b.service?.name}</div></div>
                {b.problemDescription && <div style={{ gridColumn: 'span 2' }}><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Customer's Problem</div><div style={{ fontSize: '0.875rem' }}>{b.problemDescription}</div></div>}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* Status update buttons */}
                {MECHANIC_STATUS_OPTIONS[b.status]?.map(nextStatus => (
                  <button key={nextStatus} className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(b.id, nextStatus)}>
                    → {nextStatus}
                  </button>
                ))}

                {/* Add note button (if active) */}
                {b.status !== 'Completed' && b.status !== 'Cancelled' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedJob(b); setShowNote(true); }}>
                    📝 Add Note
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showNote && selectedJob && (
        <Modal title={`Add Repair Note — ${selectedJob.bookingNumber}`} onClose={() => setShowNote(false)}>
          <div className="form-group">
            <label className="form-label">Note Type</label>
            <select className="form-control" value={note.noteType} onChange={e => setNote({ ...note, noteType: e.target.value })}>
              {NOTE_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note Content *</label>
            <textarea className="form-control" rows={4} value={note.content} onChange={e => setNote({ ...note, content: e.target.value })} placeholder="Describe the inspection findings, repair work done, or parts needed..." />
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Completion Date</label>
            <input type="date" className="form-control" min={todayStr} value={note.estimatedCompletion} onChange={e => setNote({ ...note, estimatedCompletion: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowNote(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddNote} disabled={saving || !note.content.trim()}>
              {saving ? '⏳ Adding...' : '📝 Add Note'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
