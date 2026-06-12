import React, { useState } from 'react';
import { User, Bookmark, LogOut, ArrowRight, Trash2, ShieldCheck, Edit3, Save, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

export default function UserProfile({
  user,
  setUser,
  onLogout,
  bookmarks = [],
  articles = [],
  onRemoveBookmark,
  setCurrentRoute
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  // Find bookmarked article records
  const bookmarkedArticles = articles.filter(art => bookmarks.includes(art.id));

  const handleArticleClick = (e, slug) => {
    e.preventDefault();
    setCurrentRoute(`article/${slug}`);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = {
        ...user,
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${fullName || user?.email}`
      };

      if (isSupabaseConfigured && user?.id && !user.id.startsWith('user-')) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: updatedUser.full_name,
            bio: updatedUser.bio,
            avatar_url: updatedUser.avatar_url
          })
          .eq('id', user.id);
        if (error) throw error;
      }

      // Update in registered local fallback users list
      const localUsers = JSON.parse(localStorage.getItem('digilokam_registered_users') || '[]');
      const userIndex = localUsers.findIndex(u => u.id === user?.id || u.email?.toLowerCase() === user?.email?.toLowerCase());
      if (userIndex !== -1) {
        localUsers[userIndex] = {
          ...localUsers[userIndex],
          full_name: updatedUser.full_name,
          bio: updatedUser.bio,
          avatar_url: updatedUser.avatar_url
        };
        localStorage.setItem('digilokam_registered_users', JSON.stringify(localUsers));
      }

      localStorage.setItem('digilokam_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error("[Profile] Error saving profile:", err);
      alert('Failed to save profile: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="anim-fade-in" style={{ marginBottom: '60px' }}>
      <div className="page-hero" style={{ padding: '36px 0' }}>
        <h1 className="page-title">My Account</h1>
        <p className="page-subtitle">Manage your profile, bio, and bookmarked articles</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginTop: '16px' }} className="grid-responsive-split">
        {/* Left Column: Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto 16px' }}>
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.email}`}
                alt={user?.full_name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)'
                }}
              />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>
              {user?.full_name || 'Member'}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <span
                className="badge"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  color: 'var(--primary)',
                  borderColor: 'rgba(37, 99, 235, 0.15)',
                  fontSize: '0.75rem',
                  textTransform: 'capitalize'
                }}
              >
                <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {user?.role || 'User'}
              </span>
            </div>

            {user?.bio && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.5', padding: '0 8px' }}>
                "{user.bio}"
              </p>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>Email Address</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user?.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Edit3 size={16} />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
              
              <button
                onClick={onLogout}
                className="btn btn-outline"
                style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: View Profile vs Edit Profile / Bookmarks */}
        <div>
          {isEditing ? (
            <div className="card" style={{ padding: '32px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} style={{ color: 'var(--primary)' }} />
                Edit My Profile Details
              </h2>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Full Name*</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-control"
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="form-label">Avatar URL (Image Link)</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="form-control"
                    placeholder="https://example.com/avatar.jpg"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="form-label">Writer Bio / Description</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="form-control"
                    style={{ minHeight: '100px' }}
                    placeholder="Describe yourself..."
                    disabled={saving}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={16} />
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" disabled={saving}>
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card" style={{ padding: '32px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bookmark size={20} style={{ color: 'var(--primary)' }} />
                Bookmarked Articles ({bookmarkedArticles.length})
              </h2>

              {bookmarkedArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Bookmark size={40} style={{ margin: '0 auto 16px', color: 'var(--border-color)' }} />
                  <p style={{ fontSize: '0.95rem', marginBottom: '16px' }}>You haven't bookmarked any articles yet.</p>
                  <button onClick={() => setCurrentRoute('home')} className="btn btn-secondary">
                    Browse Articles
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bookmarkedArticles.map(art => (
                    <div
                      key={art.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        gap: '16px',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={art.image_url || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=120&h=90&q=80'}
                          alt={art.title}
                          style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                          loading="lazy"
                        />
                        <a
                          href={`/article/${art.slug}`}
                          onClick={(e) => handleArticleClick(e, art.slug)}
                          style={{ fontWeight: '700', fontSize: '0.9rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {art.title}
                        </a>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => onRemoveBookmark(art.id)}
                          className="btn btn-outline"
                          style={{ padding: '8px', color: 'var(--danger)', borderRadius: '6px' }}
                          title="Remove Bookmark"
                        >
                          <Trash2 size={14} />
                        </button>
                        <a
                          href={`/article/${art.slug}`}
                          onClick={(e) => handleArticleClick(e, art.slug)}
                          className="btn btn-primary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                        >
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
