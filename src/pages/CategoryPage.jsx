import React from 'react';
import { Calendar, Clock, FolderOpen } from 'lucide-react';

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='100%' height='100%' fill='%23F8FAFC'/><circle cx='400' cy='210' r='50' fill='%23E2E8F0'/><text x='50%' y='310' font-family='sans-serif' font-size='24' font-weight='bold' fill='%2394A3B8' dominant-baseline='middle' text-anchor='middle'>DigiLokam Tech</text></svg>";

export default function CategoryPage({
  categorySlug,
  articles = [],
  categories = [],
  setCurrentRoute,
  searchQuery
}) {
  const category = categories.find(c => c.slug === categorySlug);
  
  if (!category) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Category Not Found!</h2>
        <button onClick={() => setCurrentRoute('home')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  // Filter articles by category
  const categoryArticles = articles.filter(art => String(art.category_id) === String(category.id));

  // Apply search query if present
  const displayArticles = categoryArticles.filter(art => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      art.title.toLowerCase().includes(q) ||
      art.description.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q)
    );
  });

  const handleArticleClick = (slug) => {
    setCurrentRoute(`article/${slug}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="anim-fade-in">
      {/* Category Info Header */}
      <div
        className="hero"
        style={{
          background: 'var(--bg-secondary)',
          padding: '40px 32px',
          marginBottom: '32px',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div className="hero-content">
          <span className="hero-tagline" style={{ color: 'var(--primary)' }}>
            <FolderOpen size={14} /> Category
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{category.name}</h1>
          <p style={{ opacity: '0.9', fontSize: '0.975rem', color: 'var(--text-secondary)' }}>{category.description}</p>
        </div>
      </div>

      {/* Articles Grid */}
      <div style={{ marginBottom: '40px' }}>
        {displayArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.1rem' }}>No articles found in this category yet!</p>
          </div>
        ) : (
          <div className="grid-2">
            {displayArticles.map((art) => (
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
                  <span className="badge badge-ai" style={{ marginBottom: '12px' }}>{category.name}</span>
                  {art.is_sponsored && (
                    <span className="badge" style={{ marginBottom: '12px', marginLeft: '6px', backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>SPONSORED</span>
                  )}
                  <a href={`/article/${art.slug}`} onClick={(e) => { e.preventDefault(); handleArticleClick(art.slug); }}>
                    <h3 className="card-title">{art.title}</h3>
                  </a>
                  <p className="card-desc">{art.description}</p>
                  
                  <div className="card-meta">
                    <div className="meta-author">
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${art.author_name || 'Admin'}`}
                        alt={art.author_name}
                        className="author-avatar"
                      />
                      <span>{art.author_name || 'Admin'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
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
