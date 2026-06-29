import { useState, useEffect } from 'react';
import { bookingApi, vehicleApi, serviceApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, Spinner, EmptyState, Pagination, Modal } from '../../components/common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const STEPS = ['Select Vehicle', 'Select Service', 'Date & Problem', 'Confirm'];

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState({ vehicleId: '', serviceId: '', preferredDate: '', problemDescription: '' });
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchBookings(); }, [page, filterStatus]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingApi.getAll({ page, limit: 10, status: filterStatus || undefined });
      setBookings(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const openNew = async () => {
    setStep(0);
    setBooking({ vehicleId: '', serviceId: '', preferredDate: '', problemDescription: '' });
    const [v, s] = await Promise.all([
      vehicleApi.getAll({ limit: 100 }),
      serviceApi.getAll({ limit: 100 }),
    ]);
    setVehicles(v.data.data);
    setServices(s.data.data);
    setShowNew(true);
  };

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    try {
      await bookingApi.create(booking);
      toast.success('Booking created! 🎉 We will review and approve it soon.');
      setShowNew(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (b) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingApi.updateStatus(b.id, { status: 'Cancelled' });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel booking');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const selectedVehicle = vehicles.find(v => v.id === booking.vehicleId);
  const selectedService = services.find(s => s.id === booking.serviceId);

  return (
    <DashboardLayout title="My Bookings">
      <div className="filters-bar">
        <select className="form-control" style={{ width: 220 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {['Pending', 'Approved', 'Mechanic Assigned', 'Inspection Started', 'Repair In Progress', 'Waiting for Parts', 'Completed', 'Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={openNew}>+ Book Service</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📅 My Bookings</h3>
        </div>
        {loading ? <Spinner /> : bookings.length === 0 ? (
          <EmptyState icon="📅" title="No bookings found" action={<button className="btn btn-primary" onClick={openNew}>Book Service Now</button>} />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking #</th>
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
                    <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{b.bookingNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.vehicle?.registrationNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.vehicle?.brand} {b.vehicle?.model}</div>
                    </td>
                    <td>{b.service?.name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(b.preferredDate).toLocaleDateString('en-IN')}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{b.mechanic?.name || <span style={{ color: 'var(--text-muted)' }}>Pending</span>}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowDetail(b)}>👁️ View</button>
                        {b.status === 'Pending' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b)}>Cancel</button>
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

      {/* Multi-step booking modal */}
      {showNew && (
        <Modal title="Book a Service" onClose={() => setShowNew(false)} size="lg">
          {/* Step indicator */}
          <div className="step-indicator">
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div className="step" style={{ flex: 'none' }}>
                  <div className={`step-circle ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}`}
                    style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', border: `2px solid ${i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--border)'}`, background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--bg-elevated)', color: i <= step ? 'white' : 'var(--text-muted)' }}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: i === step ? 'var(--primary-light)' : 'var(--text-muted)', marginTop: 4, textAlign: 'center', width: 70 }}>{s}</div>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? 'var(--success)' : 'var(--border)', margin: '0 4px', marginBottom: 20 }} />}
              </div>
            ))}
          </div>

          {/* Step 0: Select Vehicle */}
          {step === 0 && (
            <div>
              <h4 style={{ marginBottom: 16 }}>Select Your Vehicle</h4>
              {vehicles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  No vehicles registered. <a href="/customer/vehicles" style={{ color: 'var(--primary-light)' }}>Add one first.</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {vehicles.map(v => (
                    <div
                      key={v.id}
                      onClick={() => setBooking({ ...booking, vehicleId: v.id })}
                      style={{ padding: 14, borderRadius: 8, border: `2px solid ${booking.vehicleId === v.id ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', background: booking.vehicleId === v.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)', display: 'flex', gap: 12, alignItems: 'center', transition: 'all 0.2s' }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🚗</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{v.registrationNumber}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.brand} {v.model} — {v.fuelType} — {v.manufacturingYear}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Select Service */}
          {step === 1 && (
            <div>
              <h4 style={{ marginBottom: 16 }}>Select a Service</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                {services.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setBooking({ ...booking, serviceId: s.id })}
                    style={{ padding: 14, borderRadius: 8, border: `2px solid ${booking.serviceId === s.id ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', background: booking.serviceId === s.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.description?.slice(0, 80)}... · ⏱ {s.estimatedHours}h</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>₹{s.basePrice.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Problem */}
          {step === 2 && (
            <div>
              <div className="form-group">
                <label className="form-label">Preferred Service Date *</label>
                <input type="date" className="form-control" min={todayStr} value={booking.preferredDate} onChange={e => setBooking({ ...booking, preferredDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Describe the Problem (optional)</label>
                <textarea className="form-control" rows={4} placeholder="Describe any issues, noises, or specific requests..." value={booking.problemDescription} onChange={e => setBooking({ ...booking, problemDescription: e.target.value })} />
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4>Confirm Booking</h4>
              {[
                { label: 'Vehicle', value: `${selectedVehicle?.brand} ${selectedVehicle?.model} (${selectedVehicle?.registrationNumber})` },
                { label: 'Service', value: selectedService?.name },
                { label: 'Base Price', value: `₹${selectedService?.basePrice?.toLocaleString()}` },
                { label: 'Preferred Date', value: new Date(booking.preferredDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'Problem', value: booking.problemDescription || 'Not specified' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--warning)' }}>
                ⚠️ Final price may vary after mechanic inspection. You will be notified.
              </div>
            </div>
          )}

          <div className="modal-footer">
            {step > 0 && <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>← Back</button>}
            <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
            {step < 3 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 0 && !booking.vehicleId) ||
                  (step === 1 && !booking.serviceId) ||
                  (step === 2 && !booking.preferredDate)
                }
              >
                Next →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmitBooking} disabled={submitting}>
                {submitting ? '⏳ Booking...' : '✅ Confirm Booking'}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title={`Booking ${showDetail.bookingNumber}`} onClose={() => setShowDetail(null)} size="lg">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Status', value: <StatusBadge status={showDetail.status} /> },
              { label: 'Service', value: showDetail.service?.name },
              { label: 'Vehicle', value: `${showDetail.vehicle?.brand} ${showDetail.vehicle?.model}` },
              { label: 'Registration', value: showDetail.vehicle?.registrationNumber },
              { label: 'Preferred Date', value: new Date(showDetail.preferredDate).toLocaleDateString('en-IN') },
              { label: 'Mechanic', value: showDetail.mechanic?.name || 'Not assigned' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontWeight: 600 }}>{row.value}</div>
              </div>
            ))}
          </div>
          {showDetail.problemDescription && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Problem Description</div>
              <div style={{ fontSize: '0.875rem' }}>{showDetail.problemDescription}</div>
            </div>
          )}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Close</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
