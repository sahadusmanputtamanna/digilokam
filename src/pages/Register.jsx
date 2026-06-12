import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { authService } from '../supabase';

export default function Register({ setCurrentRoute }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await authService.signUp({ email, password, full_name: name });
      setSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        setCurrentRoute('login');
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim-fade-in" style={{ padding: '20px 0' }}>
      <div className="auth-container">
        <div style={{ color: 'var(--text-primary)', marginBottom: '16px', display: 'inline-block' }}>
          <UserPlus size={36} />
        </div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Sign up to bookmark tech articles and manage your user profile.</p>

        {error && <div className="alert alert-danger">{error}</div>}
        
        {success && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} />
            <span>Account created successfully! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
                required
                disabled={loading || success}
              />
            </div>
          </div>

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
                disabled={loading || success}
              />
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
                required
                disabled={loading || success}
              />
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px' }}
                required
                disabled={loading || success}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%' }} disabled={loading || success}>
            <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <a
            href="/login"
            onClick={(e) => { e.preventDefault(); setCurrentRoute('login'); }}
            style={{ color: 'var(--primary)', fontWeight: 'bold' }}
          >
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}
