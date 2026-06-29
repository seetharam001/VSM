export function StatusBadge({ status }) {
  const map = {
    'Pending': 'badge-pending',
    'Approved': 'badge-approved',
    'Mechanic Assigned': 'badge-mechanic-assigned',
    'Inspection Started': 'badge-inspection',
    'Repair In Progress': 'badge-repair',
    'Waiting for Parts': 'badge-waiting',
    'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled',
    'Paid': 'badge-paid',
    'Unpaid': 'badge-unpaid',
    'Pending Payment': 'badge-pending',
    'Active': 'badge-active',
    'Inactive': 'badge-inactive',
    'Open': 'badge-pending',
    'In Progress': 'badge-repair',
    'Resolved': 'badge-completed',
    'Closed': 'badge-cancelled',
  };
  return (
    <span className={`badge ${map[status] || 'badge-cancelled'}`}>
      {status}
    </span>
  );
}

export function Spinner({ size = 40 }) {
  return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', description = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="pagination-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let pageNum;
        if (totalPages <= 7) {
          pageNum = i + 1;
        } else if (page <= 4) {
          pageNum = i + 1;
        } else if (page >= totalPages - 3) {
          pageNum = totalPages - 6 + i;
        } else {
          pageNum = page - 3 + i;
        }
        return (
          <button
            key={pageNum}
            className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        );
      })}
      <button className="pagination-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>›</button>
    </div>
  );
}

export function Modal({ title, onClose, children, size = '' }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', variant = 'danger' }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...', style }) {
  return (
    <div className="search-bar" style={style}>
      <span>🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function StatCard({ icon, value, label, variant = 'primary' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className={`stat-icon ${variant}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
