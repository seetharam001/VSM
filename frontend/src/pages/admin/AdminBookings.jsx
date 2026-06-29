import { useState, useEffect } from 'react';
import { bookingApi, mechanicApi, serviceApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, Spinner, EmptyState, Pagination, SearchBar, Modal, ConfirmDialog } from '../../components/common';
import { toast } from 'react-toastify';

const STATUSES = ['Pending', 'Approved', 'Mechanic Assigned', 'Inspection Started', 'Repair In Progress', 'Waiting for Parts', 'Completed', 'Cancelled'];

const NEXT_STATUSES = {
  'Pending': ['Approved', 'Cancelled'],
  'Approved': ['Mechanic Assigned', 'Cancelled'],
  'Mechanic Assigned': ['Inspection Started'],
  'Inspection Started': ['Repair In Progress'],
  'Repair In Progress': ['Waiting for Parts', 'Completed'],
  'Waiting for Parts': ['Repair In Progress', 'Completed'],
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusData, setStatusData] = useState({ status: '', mechanicId: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => { fetchBookings(); }, [page, filterStatus]);
  useEffect(() => { mechanicApi.getAll({ limit: 100, available: 'true' }).then(r => setMechanics(r.data.data)); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingApi.getAll({ page, limit: 10, status: filterStatus || undefined });
      setBookings(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async () => {
    if (!statusData.status) return;
    setUpdating(true);
    try {
      await bookingApi.updateStatus(selectedBooking.id, {
        status: statusData.status,
        mechanicId: statusData.mechanicId || undefined,
      });
      toast.success('Booking status updated!');
      setShowStatusModal(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setUpdating(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <DashboardLayout title="Booking Management">
      <div className="filters-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search bookings..." style={{ flex: 1 }} />
        <select className="form-control" style={{ width: 200 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => { setFilterStatus(''); setSearch(''); setPage(1); }}>Reset</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📅 All Bookings</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{bookings.length} bookings</span>
        </div>

        {loading ? <Spinner /> : bookings.length === 0 ? (
          <EmptyState icon="📅" title="No bookings found" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Mechanic</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{b.bookingNumber}</span></td>
                    <td>{b.customer?.name || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600 }}>{b.vehicle?.registrationNumber}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{b.vehicle?.brand} {b.vehicle?.model}</div>
                    </td>
                    <td>{b.service?.name}</td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDate(b.preferredDate)}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{b.mechanic?.name || <span style={{ color: 'var(--text-muted)' }}>Not assigned</span>}</td>
                    <td>
                      <div className="flex gap-2">
                        {NEXT_STATUSES[b.status] && NEXT_STATUSES[b.status].length > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedBooking(b); setStatusData({ status: '', mechanicId: b.mechanicId || '' }); setShowStatusModal(true); }}>
                            Update
                          </button>
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

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <Modal title={`Update Booking ${selectedBooking.bookingNumber}`} onClose={() => setShowStatusModal(false)}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 6 }}>Current Status</div>
            <StatusBadge status={selectedBooking.status} />
          </div>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="form-control" value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })}>
              <option value="">Select new status</option>
              {NEXT_STATUSES[selectedBooking.status]?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {statusData.status === 'Mechanic Assigned' && (
            <div className="form-group">
              <label className="form-label">Assign Mechanic</label>
              <select className="form-control" value={statusData.mechanicId} onChange={e => setStatusData({ ...statusData, mechanicId: e.target.value })}>
                <option value="">Select mechanic</option>
                {mechanics.map(m => <option key={m.id} value={m.id}>{m.name} — {m.specialization}</option>)}
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating || !statusData.status}>
              {updating ? '⏳ Updating...' : '✅ Update Status'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
