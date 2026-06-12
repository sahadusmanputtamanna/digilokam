import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='100%' height='100%' fill='%23F8FAFC'/><circle cx='400' cy='210' r='50' fill='%23E2E8F0'/><text x='50%' y='310' font-family='sans-serif' font-size='24' font-weight='bold' fill='%2394A3B8' dominant-baseline='middle' text-anchor='middle'>DigiLokam Tech</text></svg>";

export default function AuthorPage({
  authorId,
  articles = [],
  setCurrentRoute
}) {
  // Filter articles by author
  const authorArticles = articles.filter(art => {
    // Check both id string matching or UUID matching
    return art.author_id === authorId || (art.author_id && String(art.author_id) === String(authorId));
  });

  // Extract author info from the first matching article or use defaults
  const firstArt = authorArticles[0];
  const authorName = firstArt?.author_name || 'Admin DigiLokam';
  const authorBio = firstArt?.author_bio || 'Contributor at DigiLokam. Sharing technology guides, tips and latest online news.';
  const authorAvatar = firstArt?.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`;

  const handleArticleClick = (slug) => {
    setCurrentRoute(`article/${slug}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="anim-fade-in">
      {/* Author Bio Header Card */}
      <div
        className="card"
        style={{
          background: 'var(--bg-secondary)',
          padding: '32px',
          marginBottom: '32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '24px',
          alignItems: 'center'
        }}
        className="grid-responsive-split"
      >
        <img
          src={authorAvatar}
          alt={authorName}
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            flexShrink: 0
          }}
        />
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <User size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>Author Profile</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>{authorName}</h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{authorBio}</p>
        </div>
      </div>

      {/* Articles Grid Title */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Articles by {authorName} ({authorArticles.length})</h2>
      </div>

      {/* Articles Grid */}
      <div style={{ marginBottom: '40px' }}>
        {authorArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.1rem' }}>No articles found for this author yet!</p>
            <button onClick={() => setCurrentRoute('home')} className="btn btn-secondary" style={{ marginTop: '16px' }}>
              Back to Home
            </button>
          </div>
        ) : (
          <div className="grid-2">
            {authorArticles.map((art) => (
              <article key={art.id} className="card article-card anim-slide-up">
                <div className="card-img-wrap">
                  <img 
                    src={art.image_url} 
                    alt={art.title} 
                    className="card-img" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="card-content">
                  {art.is_sponsored && (
                    <span className="badge" style={{ marginBottom: '12px', backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>SPONSORED</span>
                  )}
                  <a href={`/article/${art.slug}`} onClick={(e) => { e.preventDefault(); handleArticleClick(art.slug); }}>
                    <h3 className="card-title">{art.title}</h3>
                  </a>
                  <p className="card-desc">{art.description}</p>
                  
                  <div className="card-meta" style={{ marginTop: 'auto', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={12} />
                        {new Date(art.published_at || art.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} />
                        {art.reading_time}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
