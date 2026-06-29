import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { authApi } from '../../api';
import { toast } from 'react-toastify';

const navConfig = {
  admin: [
    { section: 'Overview', items: [
      { path: '/admin', icon: '📊', label: 'Dashboard', end: true },
      { path: '/admin/reports', icon: '📈', label: 'Reports' },
    ]},
    { section: 'Management', items: [
      { path: '/admin/customers', icon: '👥', label: 'Customers' },
      { path: '/admin/mechanics', icon: '🔧', label: 'Mechanics' },
      { path: '/admin/services', icon: '⚙️', label: 'Services' },
      { path: '/admin/bookings', icon: '📅', label: 'Bookings' },
      { path: '/admin/invoices', icon: '🧾', label: 'Invoices' },
    ]},
    { section: 'Support', items: [
      { path: '/admin/feedback', icon: '💬', label: 'Feedback & Complaints' },
    ]},
  ],
  customer: [
    { section: 'Overview', items: [
      { path: '/customer', icon: '🏠', label: 'Dashboard', end: true },
    ]},
    { section: 'Services', items: [
      { path: '/customer/vehicles', icon: '🚗', label: 'My Vehicles' },
      { path: '/customer/bookings', icon: '📅', label: 'My Bookings' },
      { path: '/customer/history', icon: '📋', label: 'Service History' },
      { path: '/customer/invoices', icon: '🧾', label: 'Invoices' },
    ]},
    { section: 'Account', items: [
      { path: '/customer/feedback', icon: '💬', label: 'Feedback' },
      { path: '/customer/profile', icon: '👤', label: 'Profile' },
    ]},
  ],
  mechanic: [
    { section: 'Overview', items: [
      { path: '/mechanic', icon: '🏠', label: 'Dashboard', end: true },
    ]},
    { section: 'Jobs', items: [
      { path: '/mechanic/jobs', icon: '🔧', label: 'My Jobs' },
    ]},
    { section: 'Account', items: [
      { path: '/mechanic/profile', icon: '👤', label: 'Profile' },
    ]},
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const nav = navConfig[user?.role] || [];
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🚗</div>
          <span className="sidebar-logo-text">VSM System</span>
        </div>

        <nav className="sidebar-nav">
          {nav.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || user?.email}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '4px' }}
          >
            🚪
          </button>
        </div>
      </aside>
    </>
  );
}
