import { useState, useEffect } from 'react';
import { invoiceApi, bookingApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, Spinner, EmptyState, Pagination, Modal } from '../../components/common';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function AdminInvoices() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { serviceCharge: 0, labourCharge: 0, partsCharge: 0, gstRate: 18, discount: 0 }
  });

  const [serviceCharge, labourCharge, partsCharge, gstRate, discount] = [
    watch('serviceCharge'), watch('labourCharge'), watch('partsCharge'), watch('gstRate'), watch('discount')
  ].map(v => parseFloat(v) || 0);

  const subtotal = Math.max(0, serviceCharge + labourCharge + partsCharge - discount);
  const gstAmt = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal + gstAmt).toFixed(2));

  useEffect(() => { fetchCompletedBookings(); }, [page]);

  const fetchCompletedBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingApi.getAll({ page, limit: 10, status: 'Completed' });
      setBookings(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const openGenerate = (b) => {
    setSelectedBooking(b);
    reset({ serviceCharge: b.service?.basePrice || 0, labourCharge: 0, partsCharge: 0, gstRate: 18, discount: 0 });
    setShowGenerate(true);
  };

  const onGenerate = async (data) => {
    setSaving(true);
    try {
      await invoiceApi.generate({ bookingId: selectedBooking.id, ...data });
      toast.success('Invoice generated!');
      setShowGenerate(false);
      fetchCompletedBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally { setSaving(false); }
  };

  const handlePayment = async (invoiceId, status) => {
    try {
      await invoiceApi.updatePayment(invoiceId, { paymentStatus: status, paymentMethod: 'Cash' });
      toast.success('Payment updated!');
      fetchCompletedBookings();
    } catch { toast.error('Failed'); }
  };

  return (
    <DashboardLayout title="Invoice Management">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🧾 Completed Bookings</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Generate invoices for completed services</span>
        </div>

        {loading ? <Spinner /> : bookings.length === 0 ? (
          <EmptyState icon="🧾" title="No completed bookings yet" description="Bookings marked as 'Completed' will appear here for invoicing" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Mechanic</th>
                  <th>Completed</th>
                  <th>Invoice</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{b.bookingNumber}</td>
                    <td>{b.customer?.name}</td>
                    <td>{b.service?.name}</td>
                    <td>{b.mechanic?.name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {b.completedAt ? new Date(b.completedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      {b.invoice
                        ? <span style={{ fontWeight: 600, color: 'var(--success)' }}>{b.invoice.invoiceNumber}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not generated</span>}
                    </td>
                    <td>
                      {b.invoice && <StatusBadge status={b.invoice.paymentStatus} />}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {!b.invoice ? (
                          <button className="btn btn-primary btn-sm" onClick={() => openGenerate(b)}>🧾 Generate</button>
                        ) : b.invoice.paymentStatus === 'Pending' ? (
                          <button className="btn btn-success btn-sm" onClick={() => handlePayment(b.invoice.id, 'Paid')}>💳 Mark Paid</button>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>✅ ₹{b.invoice.grandTotal?.toLocaleString()}</span>
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

      {showGenerate && selectedBooking && (
        <Modal title={`Generate Invoice — ${selectedBooking.bookingNumber}`} onClose={() => setShowGenerate(false)} size="lg">
          <form onSubmit={handleSubmit(onGenerate)}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: '0.85rem' }}>
              <strong>{selectedBooking.customer?.name}</strong> — {selectedBooking.vehicle?.registrationNumber} — {selectedBooking.service?.name}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Service Charge (₹)</label>
                <input type="number" className="form-control" {...register('serviceCharge', { min: 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Labour Charge (₹)</label>
                <input type="number" className="form-control" {...register('labourCharge', { min: 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Parts Charge (₹)</label>
                <input type="number" className="form-control" {...register('partsCharge', { min: 0 })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GST Rate (%)</label>
                <input type="number" className="form-control" {...register('gstRate', { min: 0, max: 28 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount (₹)</label>
                <input type="number" className="form-control" {...register('discount', { min: 0 })} />
              </div>
            </div>

            {/* Live preview */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>GST ({gstRate}%)</span>
                <span>₹{gstAmt.toLocaleString()}</span>
              </div>
              <hr className="divider" />
              <div className="flex-between">
                <span style={{ fontWeight: 700 }}>Grand Total</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" {...register('notes')} rows={2} placeholder="Any additional notes..." />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowGenerate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Generating...' : '🧾 Generate Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
