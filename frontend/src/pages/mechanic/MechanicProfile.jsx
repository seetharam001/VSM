import { useState, useEffect } from 'react';
import { profileApi, authApi } from '../../api';
import { useAuthStore } from '../../store';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Spinner } from '../../components/common';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function MechanicProfile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  const { register: rProfile, handleSubmit: hProfile, reset: resetProfile } = useForm();
  const { register: rPass, handleSubmit: hPass, reset: resetPass, watch } = useForm();

  useEffect(() => {
    authApi.getMe().then(r => {
      const p = r.data.data;
      setProfile(p.profile);
      resetProfile({ 
        name: p.profile?.name, 
        phone: p.profile?.phone, 
        experience: p.profile?.experience,
        specialization: p.profile?.specialization
      });
    }).finally(() => setLoading(false));
  }, []);

  const onProfileSave = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (data.name) fd.append('name', data.name);
      if (data.phone) fd.append('phone', data.phone);
      if (data.experience) fd.append('experience', data.experience);
      if (data.specialization) fd.append('specialization', data.specialization);
      if (avatarFile) fd.append('avatar', avatarFile);
      
      const { data: res } = await profileApi.update(fd);
      setProfile(res.data);
      updateUser({ name: res.data.name });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const onPasswordChange = async (data) => {
    setSaving(true);
    try {
      await profileApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      resetPass();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setSaving(false); }
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  if (loading) return <DashboardLayout title="Profile"><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout title="My Profile">
      {/* Avatar area */}
      <div className="card" style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20 }}>
        <div className="user-avatar" style={{ width: 80, height: 80, fontSize: '1.5rem' }}>
          {profile?.avatar ? <img src={profile.avatar} alt="Avatar" /> : initials}
        </div>
        <div>
          <h2 style={{ marginBottom: 4 }}>{profile?.name}</h2>
          <div style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
          <div style={{ color: 'var(--primary-light)', fontSize: '0.875rem' }}>Mechanic Account</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[{ id: 'profile', label: '👤 Edit Profile' }, { id: 'password', label: '🔐 Change Password' }].map(t => (
          <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h3 style={{ marginBottom: 20 }}>Edit Profile</h3>
          <form onSubmit={hProfile(onProfileSave)}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" {...rProfile('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" value={user?.email} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" {...rProfile('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input type="number" className="form-control" {...rProfile('experience')} />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input className="form-control" {...rProfile('specialization')} />
            </div>
            <div className="form-group">
              <label className="form-label">Profile Photo</label>
              <input type="file" className="form-control" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving...' : '✅ Save Profile'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 style={{ marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={hPass(onPasswordChange)}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" {...rPass('currentPassword', { required: 'Required' })} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" {...rPass('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" {...rPass('confirm', { validate: v => v === watch('newPassword') || 'Passwords do not match' })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Changing...' : '🔐 Change Password'}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
