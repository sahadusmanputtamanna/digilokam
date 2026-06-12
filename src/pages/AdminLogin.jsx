import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { authService } from '../supabase';

export default function AdminLogin({ setAdminUser, setCurrentRoute }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('[AdminLogin] Form submitted for:', email);

    try {
      const result = await authService.signIn(email.trim(), password);
      console.log('[AdminLogin] signIn result:', result);

      const { user, role } = result;

      if (role !== 'admin') {
        console.warn('[AdminLogin] Non-admin role:', role);
        setError('Access Denied: Administrator permissions required.');
        await authService.signOut();
        return;
      }

      console.log('[AdminLogin] Admin verified ✅, redirecting to dashboard...');
      // user already has role merged in — pass it directly
      setAdminUser(user);
      setCurrentRoute('admin/dashboard');

    } catch (err) {
      console.error('[AdminLogin] Error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim-fade-in" style={{ padding: '20px 0' }}>
      <div className="auth-container">
        <div style={{ color: 'var(--text-primary)', marginBottom: '16px', display: 'inline-block' }}>
          <Lock size={36} />
        </div>
        <h2 className="auth-title">Admin Dashboard Login</h2>
        <p className="auth-subtitle">Authorized administrator credentials required.</p>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Admin Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@digilokam.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
                required
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px', paddingRight: '40px' }}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '10px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '2px'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            id="admin-login-btn"
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '8px', width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Logging In...
              </span>
            ) : 'Verify & Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
