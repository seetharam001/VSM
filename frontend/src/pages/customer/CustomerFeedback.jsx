import { useState, useEffect } from 'react';
import { feedbackApi, bookingApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, Spinner, EmptyState } from '../../components/common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function CustomerFeedback() {
  const [tab, setTab] = useState('submit');
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (tab === 'history') {
      setLoading(true);
      feedbackApi.getAll().then(r => setMyFeedback(r.data.data)).finally(() => setLoading(false));
    }
    bookingApi.getAll({ limit: 100, status: 'Completed' }).then(r => setBookings(r.data.data));
  }, [tab]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await feedbackApi.create({ ...data, rating: rating || undefined });
      toast.success('Feedback submitted! Thank you 🙏');
      reset();
      setRating(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout title="Feedback & Support">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[{ id: 'submit', label: '✍️ Submit Feedback' }, { id: 'history', label: '📋 My Submissions' }].map(t => (
          <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'submit' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 20 }}>Submit Feedback, Complaint or Query</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-control" {...register('type', { required: 'Required' })}>
                  <option value="feedback">⭐ Feedback</option>
                  <option value="complaint">⚠️ Complaint</option>
                  <option value="query">❓ Query</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Related Booking (optional)</label>
                <select className="form-control" {...register('bookingId')}>
                  <option value="">Not related to a booking</option>
                  {bookings.map(b => <option key={b.id} value={b.id}>{b.bookingNumber} — {b.service?.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-control" {...register('subject', { required: 'Required' })} placeholder="Brief subject line" />
              {errors.subject && <span className="form-error">⚠ {errors.subject.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea className="form-control" {...register('message', { required: 'Required' })} rows={5} placeholder="Describe your feedback, complaint, or query..." />
              {errors.message && <span className="form-error">⚠ {errors.message.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Rating (optional)</label>
              <div style={{ display: 'flex', gap: 8, fontSize: '1.5rem', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} onClick={() => setRating(n)} style={{ opacity: n <= rating ? 1 : 0.3, transition: 'opacity 0.2s' }}>⭐</span>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '📤 Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {loading ? <Spinner /> : myFeedback.length === 0 ? (
            <EmptyState icon="💬" title="No submissions yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {myFeedback.map(f => (
                <div key={f.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>{f.subject}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="badge badge-inactive">{f.type}</span>
                      <StatusBadge status={f.status} />
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: f.adminReply ? 12 : 0 }}>{f.message}</p>
                  {f.adminReply && (
                    <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 8, padding: 12, borderLeft: '3px solid var(--primary)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginBottom: 4, fontWeight: 600 }}>Admin Reply</div>
                      <div style={{ fontSize: '0.875rem' }}>{f.adminReply}</div>
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(f.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
