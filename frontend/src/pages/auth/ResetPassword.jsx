import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { authApi } from '../../api';

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your new password</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Min. 8 characters"
              {...register('password', {
                required: 'Password required',
                minLength: { value: 8, message: 'Min 8 chars' },
                pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase and number' },
              })}
            />
            {errors.password && <span className="form-error">⚠ {errors.password.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Repeat password"
              {...register('confirm', { validate: (v) => v === watch('password') || 'Passwords do not match' })}
            />
            {errors.confirm && <span className="form-error">⚠ {errors.confirm.message}</span>}
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
