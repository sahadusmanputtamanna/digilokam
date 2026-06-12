import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, UserCheck } from 'lucide-react';
import { authService } from '../supabase';

export default function Login({ setUser, setCurrentRoute }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, role } = await authService.signIn(email, password);
      setUser(user);
      
      if (role === 'admin') {
        setCurrentRoute('admin/dashboard');
      } else {
        setCurrentRoute('profile');
      }
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed! Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim-fade-in" style={{ padding: '20px 0' }}>
      <div className="auth-container">
        <div style={{ color: 'var(--primary)', marginBottom: '16px', display: 'inline-block' }}>
          <UserCheck size={36} />
        </div>
        <h2 className="auth-title">Member Login</h2>
        <p className="auth-subtitle">Sign in to save bookmarks and manage your tech blog profile.</p>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%' }} disabled={loading}>
            <span>{loading ? 'Logging In...' : 'Sign In'}</span>
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <a
            href="/register"
            onClick={(e) => { e.preventDefault(); setCurrentRoute('register'); }}
            style={{ color: 'var(--primary)', fontWeight: 'bold' }}
          >
            Create Account
          </a>
        </p>
      </div>
    </div>
  );
}
