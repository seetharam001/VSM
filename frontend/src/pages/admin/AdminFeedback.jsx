import { useState, useEffect } from 'react';
import { feedbackApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, Spinner, EmptyState, Pagination, Modal } from '../../components/common';
import { toast } from 'react-toastify';

export default function AdminFeedback() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchFeedback(); }, [page, filterType, filterStatus]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data } = await feedbackApi.getAll({ page, limit: 10, type: filterType || undefined, status: filterStatus || undefined });
      setItems(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load feedback'); }
    finally { setLoading(false); }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await feedbackApi.reply(selected.id, { adminReply: reply, status: 'Resolved' });
      toast.success('Reply sent!');
      setSelected(null);
      setReply('');
      fetchFeedback();
    } catch { toast.error('Failed to send reply'); }
    finally { setSaving(false); }
  };

  const handleClose = async (id) => {
    try {
      await feedbackApi.updateStatus(id, { status: 'Closed' });
      toast.success('Closed');
      fetchFeedback();
    } catch { toast.error('Failed'); }
  };

  const typeIcon = { feedback: '⭐', complaint: '⚠️', query: '❓' };

  return (
    <DashboardLayout title="Feedback & Complaints">
      <div className="filters-bar">
        <select className="form-control" style={{ width: 180 }} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="feedback">Feedback</option>
          <option value="complaint">Complaint</option>
          <option value="query">Query</option>
        </select>
        <select className="form-control" style={{ width: 180 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <button className="btn btn-secondary" onClick={() => { setFilterType(''); setFilterStatus(''); setPage(1); }}>Reset</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">💬 Customer Feedback</h3>
        </div>
        {loading ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon="💬" title="No feedback found" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(f => (
                  <tr key={f.id}>
                    <td>{typeIcon[f.type]} {f.type}</td>
                    <td>{f.customer?.name || '—'}</td>
                    <td className="truncate" style={{ maxWidth: 180 }}>{f.subject}</td>
                    <td>{f.rating ? '⭐'.repeat(f.rating) : '—'}</td>
                    <td><StatusBadge status={f.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(f); setReply(f.adminReply || ''); }}>
                          💬 Reply
                        </button>
                        {f.status !== 'Closed' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleClose(f.id)}>Close</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {selected && (
        <Modal title="Reply to Feedback" onClose={() => setSelected(null)}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{selected.subject}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selected.message}</div>
            {selected.rating && <div style={{ marginTop: 8 }}>{'⭐'.repeat(selected.rating)}</div>}
          </div>
          {selected.adminReply && (
            <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.85rem' }}>
              <strong>Previous reply:</strong> {selected.adminReply}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Your Reply</label>
            <textarea className="form-control" value={reply} onChange={e => setReply(e.target.value)} rows={4} placeholder="Type your reply here..." />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleReply} disabled={saving || !reply.trim()}>
              {saving ? '⏳ Sending...' : '📤 Send Reply'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
