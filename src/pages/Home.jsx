import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Send, 
  TrendingUp, 
  Brain, 
  Cpu, 
  Smartphone, 
  DollarSign, 
  Share2,
  X
} from 'lucide-react';
import { subscriberService, webStoryService } from '../supabase';

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='100%' height='100%' fill='%23F8FAFC'/><circle cx='400' cy='210' r='50' fill='%23E2E8F0'/><text x='50%' y='310' font-family='sans-serif' font-size='24' font-weight='bold' fill='%2394A3B8' dominant-baseline='middle' text-anchor='middle'>DigiLokam Tech</text></svg>";

export default function Home({
  articles = [],
  categories = [],
  settings = {},
  setCurrentRoute,
  searchQuery
}) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryPage, setActiveStoryPage] = useState(0);

  useEffect(() => {
    webStoryService.getAll().then(setStories).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeStory) return;
    const pages = activeStory.pages || [];
    const timer = setTimeout(() => {
      if (activeStoryPage < pages.length - 1) {
        setActiveStoryPage(prev => prev + 1);
      } else {
        setActiveStory(null);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeStory, activeStoryPage]);

  // Filter articles based on search query
  const filteredArticles = articles.filter((art) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    
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

  // Extract featured articles (up to 5 for the slider)
  const featuredArticles = articles.filter(a => a.is_featured).slice(0, 5);
  
  // Exclude featured slider articles from the latest feed to avoid duplication
  const latestArticles = filteredArticles.filter(
    art => !featuredArticles.some(fa => fa.id === art.id)
  );

  // Auto-slide effect for the hero slider
  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % featuredArticles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredArticles.length]);

  // Trending section: Hacker News-style time-decay view ranking algorithm (views / (hours + 2)^1.5)
  const trendingArticles = [...articles]
    .map(art => {
      const hoursSinceCreation = Math.max(0, (new Date() - new Date(art.created_at || new Date())) / (1000 * 60 * 60));
      const score = (art.views || 0) / Math.pow(hoursSinceCreation + 2, 1.5);
      return { ...art, trendingScore: score };
    })
    .sort((a, b) => b.trendingScore - a.trendingScore || new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 4);

  // Popular reads sidebar: articles 5 to 9 sorted by views/date for variety
  const popularArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0) || new Date(a.created_at) - new Date(b.created_at))
    .slice(4, 9);

  const handleArticleClick = (slug) => {
    setCurrentRoute(`article/${slug}`);
  };

  const handleCategoryClick = (catId) => {
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      setCurrentRoute(`category/${cat.slug}`);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterError('');
    try {
      await subscriberService.add(newsletterEmail);
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSuccess(false), 5000);
    } catch (err) {
      setNewsletterError(err.message || 'Error subscribing.');
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const getCategoryIcon = (slug) => {
    switch (slug) {
      case 'ai-tools':
        return <Brain size={24} style={{ color: '#2563eb' }} />;
      case 'tech-tutorials':
        return <Cpu size={24} style={{ color: '#7c3aed' }} />;
      case 'mobile-tips':
        return <Smartphone size={24} style={{ color: '#06b6d4' }} />;
      case 'online-earning':
        return <DollarSign size={24} style={{ color: '#10b981' }} />;
      case 'social-tools':
        return <Share2 size={24} style={{ color: '#f59e0b' }} />;
      default:
        return <Sparkles size={24} style={{ color: '#2563eb' }} />;
    }
  };

  const getCategoryIconBg = (slug) => {
    switch (slug) {
      case 'ai-tools':
        return 'rgba(37, 99, 235, 0.08)';
      case 'tech-tutorials':
        return 'rgba(124, 58, 237, 0.08)';
      case 'mobile-tips':
        return 'rgba(6, 182, 212, 0.08)';
      case 'online-earning':
        return 'rgba(16, 185, 129, 0.08)';
      case 'social-tools':
        return 'rgba(245, 158, 11, 0.08)';
      default:
        return 'rgba(37, 99, 235, 0.08)';
    }
  };

  const currentSlideArticle = featuredArticles[activeSlide];

  return (
    <div className="anim-fade-in" style={{ padding: '0 0 24px 0' }}>
      
      {/* 1. Premium Centerpiece Hero Section with Slideshow */}
      {!searchQuery && currentSlideArticle && (
        <section className="magazine-hero-outer">
          <div className="container magazine-hero-inner">
            <div className="magazine-hero-left">
              <div className="magazine-hero-badges">
                <span className="badge-featured">
                  Featured Article
                </span>
                <span 
                  className="badge-category"
                  onClick={() => handleCategoryClick(currentSlideArticle.category_id)}
                >
                  {categories.find(c => c.id === currentSlideArticle.category_id)?.name || 'Featured'}
                </span>
              </div>
              
              <h1 className="magazine-hero-title">
                <a 
                  href={`/article/${currentSlideArticle.slug}`} 
                  onClick={(e) => { e.preventDefault(); handleArticleClick(currentSlideArticle.slug); }}
                >
                  {currentSlideArticle.title}
                </a>
              </h1>
              <p className="magazine-hero-desc">
                {currentSlideArticle.description}
              </p>
              
              <div className="magazine-hero-cta">
                <button
                  onClick={() => handleArticleClick(currentSlideArticle.slug)}
                  className="btn btn-primary btn-hero"
                >
                  <span>വായിക്കുക (Read More)</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Slider Dots */}
              {featuredArticles.length > 1 && (
                <div className="magazine-hero-dots">
                  {featuredArticles.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`magazine-hero-dot ${activeSlide === idx ? 'active' : ''}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
              
              <div className="magazine-hero-meta">
                <span 
                  className="hero-meta-author"
                  style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                  onClick={() => {
                    if (currentSlideArticle.author_id) {
                      setCurrentRoute(`author/${currentSlideArticle.author_id}`);
                      window.scrollTo(0, 0);
                    }
                  }}
                >
                  {currentSlideArticle.author_name}
                </span>
                <span className="hero-meta-divider">•</span>
                <span className="hero-meta-date">{formatDate(currentSlideArticle.published_at)}</span>
                <span className="hero-meta-divider">•</span>
                <span className="hero-meta-read">{currentSlideArticle.reading_time}</span>
              </div>
            </div>
            
            <div className="magazine-hero-right">
              <div className="magazine-hero-img-container">
                 <img 
                   src={currentSlideArticle.image_url || FALLBACK_IMAGE} 
                   alt={currentSlideArticle.title} 
                   className="magazine-hero-img"
                 />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Google Web Stories Tray */}
      {stories.length > 0 && (
        <section className="container" style={{ marginTop: '32px' }}>
          <div className="magazine-section-header" style={{ marginBottom: '16px' }}>
            <h2 className="magazine-section-title">Web Stories</h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
            {stories.map(story => (
              <div
                key={story.id}
                onClick={() => {
                  setActiveStory(story);
                  setActiveStoryPage(0);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  padding: '2.5px',
                  background: 'linear-gradient(to tr, #f59e0b, #ef4444, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={story.cover_url}
                    alt={story.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid white'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', color: 'var(--text-primary)' }}>
                  {story.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Web Story Slideshow Modal */}
      {activeStory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Close button */}
          <button
            onClick={() => setActiveStory(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            <X size={28} />
          </button>

          {/* Story Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '420px',
            height: '100%',
            maxHeight: '740px',
            backgroundColor: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Progress indicators */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              display: 'flex',
              gap: '4px',
              zIndex: 10
            }}>
              {(activeStory.pages || []).map((_, idx) => (
                <div key={idx} style={{
                  height: '3px',
                  flexGrow: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '1.5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: idx < activeStoryPage ? '100%' : idx === activeStoryPage ? '100%' : '0%',
                    backgroundColor: 'white',
                    transition: idx === activeStoryPage ? 'width 4s linear' : 'none'
                  }} />
                </div>
              ))}
            </div>

            {/* Tap areas to navigate */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '40%',
              zIndex: 5,
              cursor: 'w-resize'
            }} onClick={() => {
              if (activeStoryPage > 0) {
                setActiveStoryPage(prev => prev - 1);
              }
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '60%',
              zIndex: 5,
              cursor: 'e-resize'
            }} onClick={() => {
              const pages = activeStory.pages || [];
              if (activeStoryPage < pages.length - 1) {
                setActiveStoryPage(prev => prev + 1);
              } else {
                setActiveStory(null);
              }
            }} />

            {/* Slide Page Content */}
            {activeStory.pages && activeStory.pages[activeStoryPage] && (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <img
                  src={activeStory.pages[activeStoryPage].image_url}
                  alt={activeStory.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Text overlay card */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '40px 24px 32px 24px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.4) 70%, transparent)',
                  color: 'white',
                  textAlign: 'left'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px', lineHeight: '1.4' }}>
                    {activeStory.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', opacity: '0.95', lineHeight: '1.6', margin: 0 }}>
                    {activeStory.pages[activeStoryPage].text}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* If search query is active, render search results in a container */}
      {searchQuery ? (
        <section className="container" style={{ marginTop: '40px' }}>
          <div className="magazine-section-header">
            <h2 className="magazine-section-title">
              Search Results for: "{searchQuery}"
            </h2>
          </div>
          {filteredArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No articles found!</p>
              <p style={{ fontSize: '0.875rem' }}>Try searching for another keyword.</p>
            </div>
          ) : (
            <div className="magazine-latest-grid-3col">
              {filteredArticles.map((art) => (
                <article key={art.id} className="magazine-card-modern anim-slide-up">
                  <div className="magazine-card-img-wrap">
                    <img 
                      src={art.image_url || FALLBACK_IMAGE} 
                      alt={art.title} 
                      className="magazine-card-img"
                      loading="lazy"
                    />
                    <span className="magazine-card-badge">
                      {categories.find(c => c.id === art.category_id)?.name || 'Technology'}
                    </span>
                    {art.is_sponsored && (
                      <span className="magazine-card-badge" style={{ left: 'auto', right: '12px', backgroundColor: '#ef4444', color: '#fff' }}>
                        SPONSORED
                      </span>
                    )}
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
                      <span
                        style={{ cursor: 'pointer', color: 'var(--primary)' }}
                        onClick={() => {
                          if (art.author_id) {
                            setCurrentRoute(`author/${art.author_id}`);
                            window.scrollTo(0, 0);
                          }
                        }}
                      >
                        {art.author_name}
                      </span>
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
        </section>
      ) : (
        <>
          {/* 2. Full-Width Categories Section */}
          <section className="container magazine-categories-section">
            <div className="magazine-section-header">
              <h2 className="magazine-section-title">
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                Explore Categories
              </h2>
            </div>
            <div className="magazine-category-grid">
              {categories.map((cat) => {
                const count = articles.filter(a => a.category_id === cat.id).length;
                return (
                  <div 
                    key={cat.id} 
                    className="magazine-category-card"
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <div 
                      className="magazine-category-icon-wrap"
                      style={{ backgroundColor: getCategoryIconBg(cat.slug) }}
                    >
                      {getCategoryIcon(cat.slug)}
                    </div>
                    <h3 className="magazine-category-name">{cat.name}</h3>
                    <span className="magazine-category-count">{count} {count === 1 ? 'Article' : 'Articles'}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Full-Width Trending Section */}
          {trendingArticles.length > 0 && (
            <section className="container magazine-trending-section">
              <div className="magazine-section-header" style={{ borderBottom: 'none', marginBottom: '20px', paddingBottom: '0' }}>
                <h2 className="magazine-section-title">
                  <TrendingUp size={18} style={{ color: 'var(--danger)' }} />
                  Trending on DigiLokam
                </h2>
              </div>
              <div className="magazine-trending-grid">
                {trendingArticles.map((art, idx) => (
                  <div 
                    key={art.id} 
                    className="magazine-trending-card"
                    onClick={() => handleArticleClick(art.slug)}
                  >
                    <div className="magazine-trending-num">0{idx + 1}</div>
                    <div className="magazine-trending-content">
                      <span className="magazine-trending-category">
                        {categories.find(c => c.id === art.category_id)?.name}
                      </span>
                      <a
                        href={`/article/${art.slug}`}
                        onClick={(e) => { e.preventDefault(); handleArticleClick(art.slug); }}
                        className="magazine-trending-title"
                      >
                        {art.title}
                      </a>
                      <span className="magazine-trending-meta">
                        {formatDate(art.published_at)} • {art.reading_time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AdSense Placement between Trending and Latest Publications */}
          {settings.showBannerAds && (
            <div className="container" style={{ margin: '20px auto 40px' }}>
              <div className="ad-slot" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                <span className="ad-badge" style={{ fontSize: '0.6rem', padding: '2px 6px', backgroundColor: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '0.05em' }}>SPONSORED</span>
                <p style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '8px 0 4px' }}>
                  Google AdSense Responsive Banner | Client ID: {settings.adsenseClientId}
                </p>
                <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>slot="homepage_mid_banner_728x90"</code>
              </div>
            </div>
          )}
 
          {/* 4. Latest Articles (Full-Width 3-Column Grid) */}
          <section className="container magazine-latest-section" style={{ marginBottom: '56px' }}>
            <div className="magazine-section-header">
              <h2 className="magazine-section-title">
                Latest Publications
              </h2>
            </div>
            <div className="magazine-latest-grid-3col">
              {latestArticles.slice(0, visibleCount).map((art) => (
                <article key={art.id} className="magazine-card-modern anim-slide-up">
                  <div className="magazine-card-img-wrap">
                    <img 
                      src={art.image_url || FALLBACK_IMAGE} 
                      alt={art.title} 
                      className="magazine-card-img"
                      loading="lazy"
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
                      <span
                        style={{ cursor: 'pointer', color: 'var(--primary)' }}
                        onClick={() => {
                          if (art.author_id) {
                            setCurrentRoute(`author/${art.author_id}`);
                            window.scrollTo(0, 0);
                          }
                        }}
                      >
                        {art.author_name}
                      </span>
                      <span>•</span>
                      <span>{formatDate(art.published_at)}</span>
                      <span>•</span>
                      <span>{art.reading_time}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {latestArticles.length > visibleCount && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 24px',
                    fontWeight: '600',
                    fontSize: '0.925rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <span>Load More Articles</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>

          {/* 5. Popular Reads (Full-Width 4-Column Grid) */}
          <section className="container magazine-popular-section" style={{ marginBottom: '56px' }}>
            <div className="magazine-section-header">
              <h2 className="magazine-section-title">
                Popular Reads
              </h2>
            </div>
            <div className="magazine-popular-grid-4col">
              {popularArticles.map((art) => (
                <div 
                  key={art.id} 
                  className="magazine-popular-card-full"
                  onClick={() => handleArticleClick(art.slug)}
                >
                  <div className="magazine-popular-card-img-wrap">
                    <img 
                      src={art.image_url || FALLBACK_IMAGE} 
                      alt={art.title} 
                      className="magazine-popular-card-img"
                      loading="lazy"
                    />
                    <span className="magazine-popular-card-badge">
                      {categories.find(c => c.id === art.category_id)?.name}
                    </span>
                  </div>
                  <div className="magazine-popular-card-body">
                    <h3 className="magazine-popular-card-title">
                      <a
                        href={`/article/${art.slug}`}
                        onClick={(e) => { e.preventDefault(); handleArticleClick(art.slug); }}
                      >
                        {art.title}
                      </a>
                    </h3>
                    <span className="magazine-popular-card-date">
                      {formatDate(art.published_at)} • {art.reading_time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Newsletter (Full-Width Banner) */}
          <section className="container newsletter-section-full" style={{ marginBottom: '40px' }}>
            <div className="newsletter-box-full anim-slide-up">
              <div className="newsletter-box-full-content">
                <h3 className="newsletter-title-full">Subscribe to DigiLokam</h3>
                <p className="newsletter-desc-full">
                  Join our newsletter to receive weekly AI tool guides, tech tutorials, and digital tips.
                </p>
                {newsletterSuccess ? (
                  <div className="alert alert-success" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    Subscription successful! Thank you for subscribing.
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleNewsletterSubmit} className="newsletter-form-full">
                      <input
                        type="email"
                        placeholder="Your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="newsletter-input-full"
                        required
                      />
                      <button type="submit" className="btn btn-primary btn-newsletter-submit">
                        <span>Subscribe Now</span>
                        <Send size={14} />
                      </button>
                    </form>
                    {newsletterError && (
                      <div className="alert alert-danger" style={{ maxWidth: '400px', margin: '12px auto 0', padding: '6px' }}>
                        {newsletterError}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
