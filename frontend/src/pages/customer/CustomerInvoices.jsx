import { useState, useEffect } from 'react';
import { invoiceApi, bookingApi } from '../../api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, Spinner, EmptyState, Modal } from '../../components/common';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CustomerInvoices() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    bookingApi.getAll({ limit: 100, status: 'Completed' })
      .then(r => setBookings(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const viewInvoice = async (bookingId) => {
    setLoadingInvoice(true);
    try {
      const { data } = await invoiceApi.getByBooking(bookingId);
      setSelectedInvoice(data.data);
    } catch { toast.error('Invoice not generated yet'); }
    finally { setLoadingInvoice(false); }
  };

  const downloadPDF = async () => {
    const el = document.getElementById('invoice-print');
    if (!el) return;
    toast.info('Generating PDF...');
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice-${selectedInvoice.invoiceNumber}.pdf`);
    toast.success('PDF downloaded!');
  };

  return (
    <DashboardLayout title="My Invoices">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🧾 Invoices</h3>
        </div>
        {loading ? <Spinner /> : bookings.length === 0 ? (
          <EmptyState icon="🧾" title="No invoices yet" description="Invoices will appear here after your service is completed" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Service</th>
                  <th>Vehicle</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{b.bookingNumber}</td>
                    <td>{b.service?.name}</td>
                    <td>{b.vehicle?.registrationNumber}</td>
                    <td>{b.invoice?.invoiceNumber || <span style={{ color: 'var(--text-muted)' }}>Not generated</span>}</td>
                    <td>{b.invoice ? <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{b.invoice.grandTotal?.toLocaleString()}</span> : '—'}</td>
                    <td>{b.invoice ? <StatusBadge status={b.invoice.paymentStatus} /> : '—'}</td>
                    <td>
                      {b.invoice ? (
                        <button className="btn btn-primary btn-sm" onClick={() => viewInvoice(b.id)}>
                          🧾 View Invoice
                        </button>
                      ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending generation</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loadingInvoice && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}><Spinner /></div>}

      {selectedInvoice && (
        <Modal title="Invoice" onClose={() => setSelectedInvoice(null)} size="lg">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={downloadPDF}>📥 Download PDF</button>
          </div>

          {/* Invoice print area */}
          <div id="invoice-print" style={{ background: 'white', color: '#1a1a2e', padding: '32px', borderRadius: 8, fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366f1' }}>🚗 VSM</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Vehicle Service Management</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>INVOICE</div>
                <div style={{ color: '#6366f1', fontWeight: 600 }}>{selectedInvoice.invoiceNumber}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            {/* Customer & Vehicle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8, borderBottom: '2px solid #6366f1', paddingBottom: 4 }}>Customer Details</div>
                <div style={{ fontWeight: 600 }}>{selectedInvoice.booking?.customer?.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedInvoice.booking?.customer?.user?.email}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedInvoice.booking?.customer?.phone}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8, borderBottom: '2px solid #6366f1', paddingBottom: 4 }}>Vehicle Details</div>
                <div style={{ fontWeight: 600 }}>{selectedInvoice.booking?.vehicle?.brand} {selectedInvoice.booking?.vehicle?.model}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedInvoice.booking?.vehicle?.registrationNumber}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Fuel: {selectedInvoice.booking?.vehicle?.fuelType}</div>
              </div>
            </div>

            {/* Service Info */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, borderBottom: '2px solid #6366f1', paddingBottom: 4 }}>Service Details</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{selectedInvoice.booking?.service?.name}</span>
                <span>Booking: {selectedInvoice.booking?.bookingNumber}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Mechanic: {selectedInvoice.booking?.mechanic?.name || 'N/A'}</div>
            </div>

            {/* Charges */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Service Charge', amount: selectedInvoice.serviceCharge },
                  { label: 'Labour Charge', amount: selectedInvoice.labourCharge },
                  { label: 'Parts Charge', amount: selectedInvoice.partsCharge },
                ].filter(r => r.amount > 0).map(r => (
                  <tr key={r.label} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px' }}>{r.label}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ maxWidth: 280, marginLeft: 'auto' }}>
              {[
                { label: 'Subtotal', value: `₹${selectedInvoice.subtotal?.toLocaleString()}` },
                selectedInvoice.discount > 0 && { label: 'Discount', value: `-₹${selectedInvoice.discount?.toLocaleString()}` },
                { label: `GST (${selectedInvoice.gstRate}%)`, value: `₹${selectedInvoice.gstAmount?.toLocaleString()}` },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 800, fontSize: '1.1rem', borderTop: '3px solid #6366f1', marginTop: 4 }}>
                <span>Grand Total</span>
                <span style={{ color: '#6366f1' }}>₹{selectedInvoice.grandTotal?.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Status */}
            <div style={{ marginTop: 24, padding: 12, background: selectedInvoice.paymentStatus === 'Paid' ? '#d1fae5' : '#fef3c7', borderRadius: 8, textAlign: 'center', fontWeight: 700, color: selectedInvoice.paymentStatus === 'Paid' ? '#065f46' : '#92400e' }}>
              {selectedInvoice.paymentStatus === 'Paid' ? '✅ PAID' : '⏳ PAYMENT PENDING'}
            </div>

            <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
              Thank you for choosing VSM - Vehicle Service Management System
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>Close</button>
            <button className="btn btn-primary" onClick={downloadPDF}>📥 Download PDF</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
