import { useState, useEffect } from 'react';
import { bookingApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Spinner, EmptyState, Modal } from '../../components/common';
import { toast } from 'react-toastify';

export default function CustomerHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    bookingApi.getAll({ limit: 100, status: 'Completed' })
      .then(r => setHistory(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const viewDetails = async (b) => {
    setLoadingDetail(true);
    try {
      const { data } = await bookingApi.getById(b.id);
      setSelected(data.data);
    } catch {
      toast.error('Failed to load details');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <DashboardLayout title="Service History">
      {loadingDetail && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}><Spinner /></div>}
      
      {loading ? <Spinner /> : history.length === 0 ? (
        <EmptyState icon="📋" title="No service history yet" description="Completed services will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '2.5rem' }}>✅</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)', marginRight: 12 }}>{b.bookingNumber}</span>
                    <span style={{ fontWeight: 600 }}>{b.service?.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Completed: {b.completedAt ? new Date(b.completedAt).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🚗 {b.vehicle?.brand} {b.vehicle?.model} ({b.vehicle?.registrationNumber})</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🔧 {b.mechanic?.name || 'N/A'}</span>
                  {b.invoice && <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{b.invoice?.grandTotal?.toLocaleString()}</span>}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => viewDetails(b)}>View Details</button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={`Service History — ${selected.bookingNumber}`} onClose={() => setSelected(null)} size="lg">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Service</div><div style={{ fontWeight: 600 }}>{selected.service?.name}</div></div>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Vehicle</div><div style={{ fontWeight: 600 }}>{selected.vehicle?.registrationNumber}</div></div>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Mechanic</div><div style={{ fontWeight: 600 }}>{selected.mechanic?.name || 'N/A'}</div></div>
            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Amount</div><div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{selected.invoice?.grandTotal?.toLocaleString() || 'N/A'}</div></div>
          </div>
          {selected.repairNotes?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 12 }}>🔧 Mechanic Notes</h4>
              {selected.repairNotes.map(n => (
                <div key={n.id} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span className="badge badge-inspection">{n.noteType}</span>
                    <span>{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>{n.content}</div>
                </div>
              ))}
            </div>
          )}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
