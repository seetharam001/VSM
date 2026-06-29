import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import { notificationApi, authApi } from '../../api';

export default function Topbar({ title }) {
  const { toggleSidebar } = useUIStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationApi.getAll({ limit: 10 });
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const notificationIcons = {
    booking_created: '📅',
    booking_approved: '✅',
    mechanic_assigned: '🔧',
    inspection_started: '🔍',
    repair_started: '🛠️',
    service_completed: '🎉',
    invoice_generated: '🧾',
    payment_received: '💳',
    general: '🔔',
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="flex gap-3" style={{ alignItems: 'center' }}>
        <button className="hamburger" onClick={toggleSidebar}>☰</button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 600 }}>{user?.name || user?.email}</span>
          <span style={{ padding: '2px 6px', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'capitalize' }}>{user?.role}</span>
        </div>

        <div className="notification-bell" ref={dropdownRef}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ fontSize: '1.2rem', position: 'relative' }}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {showDropdown && (
            <div className="notification-dropdown">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="empty-state-icon">🔔</div>
                  <div className="empty-state-title">No notifications</div>
                </div>
              ) : (
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{notificationIcons[n.type] || '🔔'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.8rem', marginBottom: '2px' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.isRead && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="btn btn-ghost btn-sm" 
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          🚪 Logout
        </button>
      </div>
    </header>
  );
}
