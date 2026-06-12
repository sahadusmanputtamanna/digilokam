import React from 'react';
import { Flame, Tag } from 'lucide-react';

export default function Sidebar({
  articles = [],
  categories = [],
  settings = {},
  setCurrentRoute
}) {
  // Sort popular articles by view count if real views exist
  const hasRealViewsData = articles.some(a => a.views > 0);
  const popularArticles = hasRealViewsData
    ? [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).filter(a => a.views > 0).slice(0, 3)
    : [];

  // Helper to count articles in category
  const getCategoryCount = (catId) => {
    return articles.filter((a) => a.category_id === Number(catId) || a.category_id === String(catId)).length;
  };

  const handleArticleClick = (e, slug) => {
    e.preventDefault();
    setCurrentRoute(`article/${slug}`);
    window.scrollTo(0, 0);
  };

  const handleCategoryClick = (e, slug) => {
    e.preventDefault();
    setCurrentRoute(`category/${slug}`);
    window.scrollTo(0, 0);
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 1. Google AdSense Ready Placement (Sidebar Widget) */}
      {settings.showSidebarAds && (
        <div className="sidebar-widgetAd" style={{ marginBottom: '32px' }}>
          <div className="ad-slot">
            <span className="ad-badge">SPONSORED</span>
            <div style={{ padding: '24px 12px', fontSize: '0.75rem' }}>
              <p style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Google AdSense Banner</p>
              <p style={{ fontSize: '0.75rem', marginTop: '6px' }}>Slot: sidebar_widget_300x250</p>
              <code style={{ fontSize: '0.7rem', display: 'block', marginTop: '10px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px', overflowX: 'auto' }}>
                data-ad-client="{settings.adsenseClientId || 'ca-pub-xxxx'}"
              </code>
            </div>
          </div>
        </div>
      )}

      {/* 2. Popular Articles Section */}
      {popularArticles.length > 0 && (
        <div className="sidebar-widget">
          <h3 className="widget-title">
            <Flame size={16} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--danger)' }} />
            Popular Articles
          </h3>
          <div className="popular-list">
            {popularArticles.map((art) => (
              <a
                key={art.id}
                href={`/article/${art.slug}`}
                onClick={(e) => handleArticleClick(e, art.slug)}
                className="popular-item"
              >
                <img 
                  src={art.image_url} 
                  alt={art.title} 
                  className="popular-img" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23F1F5F9'/><text x='50%' y='50%' font-size='10' font-family='sans-serif' font-weight='bold' fill='%2394A3B8' dominant-baseline='middle' text-anchor='middle'>DigiLokam</text></svg>";
                  }}
                />
                <div className="popular-info">
                  <h4 className="popular-title">{art.title}</h4>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}


      {/* 4. Categories Section */}
      <div className="sidebar-widget">
        <h3 className="widget-title">
          <Tag size={16} style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--primary)' }} />
          Categories
        </h3>
        <div className="categories-list">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#category/${cat.slug}`}
              onClick={(e) => handleCategoryClick(e, cat.slug)}
              className="category-item"
            >
              <span>{cat.name}</span>
              <span className="category-count">{getCategoryCount(cat.id)}</span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
