import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
      <div style={{ fontSize: '6rem' }}>🔍</div>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-light)' }}>404</h1>
      <h2 style={{ color: 'var(--text-secondary)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">🏠 Go Home</Link>
    </div>
  );
}

export function Forbidden() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
      <div style={{ fontSize: '6rem' }}>🚫</div>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--danger)' }}>403</h1>
      <h2 style={{ color: 'var(--text-secondary)' }}>Access Forbidden</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>You don't have permission to access this page.</p>
      <Link to="/" className="btn btn-primary">🏠 Go Home</Link>
    </div>
  );
}
