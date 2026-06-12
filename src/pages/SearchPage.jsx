import React from 'react';

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='100%' height='100%' fill='%23F8FAFC'/><circle cx='400' cy='210' r='50' fill='%23E2E8F0'/><text x='50%' y='310' font-family='sans-serif' font-size='24' font-weight='bold' fill='%2394A3B8' dominant-baseline='middle' text-anchor='middle'>DigiLokam Tech</text></svg>";

export default function SearchPage({
  articles = [],
  categories = [],
  searchQuery = '',
  setCurrentRoute
}) {
  const handleArticleClick = (slug) => {
    setCurrentRoute(`article/${slug}`);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const q = searchQuery.toLowerCase().trim();
  const searchResults = articles.filter((art) => {
    if (!q) return false;
    
    const cat = categories.find(c => c.id === art.category_id);
    const catName = cat ? cat.name.toLowerCase() : '';
    
    return (
      art.title.toLowerCase().includes(q) ||
      art.description.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      catName.includes(q) ||
      (art.tags && art.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="anim-fade-in">
      <div 
        className="hero" 
        style={{ 
          background: 'var(--bg-secondary)', 
          padding: '40px 32px', 
          marginBottom: '32px', 
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}
      >
        <div className="hero-content">
          <h1 className="hero-title" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Search Results</h1>
          <p style={{ opacity: '0.9', fontSize: '0.975rem', color: 'var(--text-secondary)' }}>
            {q ? `Showing articles matching "${searchQuery}"` : 'Type keywords in the search bar above to begin searching'}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        {!q ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.1rem' }}>Enter a query in the search bar to search articles.</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>No articles found</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Try searching for a different keyword like "chatgpt", "AI", or "tech".</p>
          </div>
        ) : (
          <div className="magazine-latest-grid-3col">
            {searchResults.map((art) => (
              <article key={art.id} className="magazine-card-modern anim-slide-up">
                <div className="magazine-card-img-wrap">
                  <img 
                    src={art.image_url} 
                    alt={art.title} 
                    className="magazine-card-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                  <span className="magazine-card-badge">
                    {categories.find(c => c.id === art.category_id)?.name || 'Technology'}
                  </span>
                </div>
                <div className="magazine-card-body">
                  <h3 className="magazine-card-title">
                    <a 
                      href={`/article/${art.slug}`} 
                      onClick={(e) => { e.preventDefault(); handleArticleClick(art.slug); }}
                    >
                      {art.title}
                    </a>
                  </h3>
                  <p className="magazine-card-excerpt">{art.description}</p>
                  <div className="magazine-card-meta">
                    <span>{art.author_name}</span>
                    <span>•</span>
                    <span>{formatDate(art.published_at)}</span>
                    <span>•</span>
                    <span>{art.reading_time}</span>
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
