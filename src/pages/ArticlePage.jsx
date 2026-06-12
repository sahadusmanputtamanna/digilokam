import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, MessageSquare, Send, Check, Share2, Link, Bookmark } from 'lucide-react';
import { commentService, articleService, notificationService } from '../supabase';

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='100%' height='100%' fill='%23F8FAFC'/><circle cx='400' cy='210' r='50' fill='%23E2E8F0'/><text x='50%' y='310' font-family='sans-serif' font-size='24' font-weight='bold' fill='%2394A3B8' dominant-baseline='middle' text-anchor='middle'>DigiLokam Tech</text></svg>";

export default function ArticlePage({
  slug,
  articles = [],
  categories = [],
  settings = {},
  setCurrentRoute,
  user,
  bookmarks = [],
  onAddBookmark,
  onRemoveBookmark
}) {
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const art = articles.find(a => a.slug === slug);
    setArticle(art);
    if (art) {
      commentService.getByArticleId(art.id).then(setComments).catch(console.error);
      
      // Track views in Supabase
      if (!art.viewsIncremented) {
        art.viewsIncremented = true; // prevent double counting in same session
        art.views = (art.views || 0) + 1;
        articleService.incrementViews(art.id).catch(console.error);
      }

      // Update document title and meta description dynamically
      document.title = `${art.seo_title || art.title} - DigiLokam`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', art.seo_description || art.description || '');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = art.seo_description || art.description || '';
        document.head.appendChild(meta);
      }
    }

    // Clean up title and description when component unmounts
    return () => {
      document.title = "DigiLokam - Malayalam Tech & Digital Hub";
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', "ഡിജിലോകം - മലയാളം ടെക്നോളജി വാർത്തകളും ഗൈഡുകളും");
      }
    };
  }, [slug, articles]);

  // Inject structured JSON-LD schema for advanced SEO
  useEffect(() => {
    if (!article) return;
    
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.description || article.content.substring(0, 150),
      "image": [article.image_url || FALLBACK_IMAGE],
      "datePublished": article.published_at || article.created_at,
      "dateModified": article.updated_at || article.published_at || article.created_at,
      "author": [{
        "@type": "Person",
        "name": article.author_name || "Admin DigiLokam",
        "url": window.location.origin + "/profile"
      }],
      "publisher": {
        "@type": "Organization",
        "name": "DigiLokam",
        "logo": {
          "@type": "ImageObject",
          "url": window.location.origin + "/favicon.ico"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    };

    const scriptId = "jsonld-article-schema";
    let scriptEl = document.getElementById(scriptId);
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schemaData);

    return () => {
      const script = document.getElementById(scriptId);
      if (script) script.remove();
    };
  }, [article]);

  // Clean trailing carriage returns and normalize headings & IDs
  const getHeadingId = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u0d00-\u0d7f]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Pre-calculate headings with exact ID uniqueness matching the body
  let headings = [];
  if (article) {
    const cleanContent = article.content.replace(/\r/g, '');
    const sections = cleanContent.split('\n\n');
    const idCounts = {};
    
    sections.forEach(sect => {
      const trimmed = sect.trim();
      if (!trimmed) return;
      
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        const isH2 = trimmed.startsWith('## ');
        const rawText = trimmed.replace(/^###?\s+/, '');
        const text = rawText.replace(/\*\*|__/g, '').trim();
        let id = getHeadingId(text);
        if (!id) id = 'section';
        
        if (idCounts[id] !== undefined) {
          idCounts[id]++;
          id = `${id}-${idCounts[id]}`;
        } else {
          idCounts[id] = 0;
        }
        
        headings.push({ text, id, level: isH2 ? 2 : 3 });
      }
    });
  }

  // Smooth scroll and active heading highlights
  useEffect(() => {
    if (window.location.hash && article) {
      const hashId = window.location.hash.substring(1);
      const decodedId = decodeURIComponent(hashId);
      setTimeout(() => {
        const element = document.getElementById(decodedId);
        if (element) {
          const offsetPosition = element.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          setActiveId(decodedId);
        }
      }, 150);
    }
  }, [article]);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      let currentActiveId = '';
      
      // Look for the last heading that is in or above the top view threshold (120px offset)
      for (let i = 0; i < headings.length; i++) {
        const el = document.getElementById(headings[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            currentActiveId = headings[i].id;
          }
        }
      }

      if (window.scrollY < 80) {
        currentActiveId = '';
      }

      if (currentActiveId !== activeId) {
        setActiveId(currentActiveId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings, activeId]);

  const handleTocClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - 90;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update URL hash state
      window.history.pushState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Article Not Found!</h2>
        <button onClick={() => setCurrentRoute('home')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(article.id);
  const category = categories.find(c => c.id === article.category_id);

  // Related articles recommendation algorithm:
  // 1. Same category first
  let matched = articles.filter(a => a.category_id === article.category_id && a.id !== article.id);

  // 2. If fewer than 2, match by tag overlap
  if (matched.length < 2) {
    const matchedIds = new Set(matched.map(a => a.id));
    const activeTags = article.tags || [];
    if (activeTags.length > 0) {
      const tagMatches = articles.filter(a => {
        if (a.id === article.id || matchedIds.has(a.id)) return false;
        const aTags = a.tags || [];
        return aTags.some(t => activeTags.includes(t));
      });
      matched = [...matched, ...tagMatches];
    }
  }

  // 3. If still fewer than 2, fill with the latest general articles
  if (matched.length < 2) {
    const matchedIds = new Set(matched.map(a => a.id));
    const latestFallbacks = articles.filter(a => a.id !== article.id && !matchedIds.has(a.id));
    matched = [...matched, ...latestFallbacks];
  }

  const relatedArticles = matched.slice(0, 2);

  const renderArticleBody = (mdText) => {
    const cleanText = mdText.replace(/\r/g, '');
    const sections = cleanText.split('\n\n');
    let hasInsertedAd = false;
    const bodyElements = [];
    const idCounts = {};

    sections.forEach((sect, idx) => {
      const trimmed = sect.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace(/^##\s+/, '').replace(/\*\*|__/g, '').trim();
        let id = getHeadingId(text);
        if (!id) id = 'section';
        if (idCounts[id] !== undefined) {
          idCounts[id]++;
          id = `${id}-${idCounts[id]}`;
        } else {
          idCounts[id] = 0;
        }
        bodyElements.push(<h2 key={`h2-${idx}`} id={id}>{text}</h2>);
      }
      else if (trimmed.startsWith('### ')) {
        const text = trimmed.replace(/^###\s+/, '').replace(/\*\*|__/g, '').trim();
        let id = getHeadingId(text);
        if (!id) id = 'section';
        if (idCounts[id] !== undefined) {
          idCounts[id]++;
          id = `${id}-${idCounts[id]}`;
        } else {
          idCounts[id] = 0;
        }
        bodyElements.push(<h3 key={`h3-${idx}`} id={id}>{text}</h3>);
      }
      else if (trimmed.startsWith('- ')) {
        const listItems = trimmed.split('\n').map((item, lIdx) => (
          <li key={lIdx}>{item.replace('- ', '')}</li>
        ));
        bodyElements.push(<ul key={`list-${idx}`} style={{ marginLeft: '20px', marginBottom: '20px', paddingLeft: '10px' }}>{listItems}</ul>);
      }
      else if (/^\d+\.\s/.test(trimmed)) {
        const listItems = trimmed.split('\n').map((item, lIdx) => (
          <li key={lIdx}>{item.replace(/^\d+\.\s+/, '')}</li>
        ));
        bodyElements.push(<ol key={`ol-${idx}`} style={{ marginLeft: '20px', marginBottom: '20px', paddingLeft: '10px' }}>{listItems}</ol>);
      }
      else {
        bodyElements.push(<p key={`p-${idx}`}>{trimmed}</p>);
      }

      if (settings.showInArticleAds && !hasInsertedAd && idx === Math.floor(sections.length / 2)) {
        hasInsertedAd = true;
        bodyElements.push(
          <div key="in-article-ad" className="ad-slot" style={{ margin: '28px 0' }}>
            <span className="ad-badge">SPONSORED</span>
            <div style={{ padding: '12px 6px', fontSize: '0.75rem' }}>
              <p style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Google AdSense In-Article Banner</p>
              <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                slot="in_article_ad_468x60" | Client: {settings.adsenseClientId}
              </code>
            </div>
          </div>
        );
      }
    });

    return bodyElements;
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim()) return;

    try {
      const newComm = await commentService.add({
        article_id: article.id,
        author_name: newCommentName,
        content: newCommentText
      });
      setComments(prev => [newComm, ...prev]);
      // Trigger Admin notification
      notificationService.sendToAdmins(
        'New Comment Pending Approval',
        `A new comment was posted by "${newCommentName}" on "${article.title}".`,
        'comment'
      ).catch(console.error);
      setNewCommentName('');
      setNewCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <article className="anim-fade-in" style={{ marginBottom: '60px' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span onClick={() => setCurrentRoute('home')} style={{ cursor: 'pointer' }}>Home</span>
        <ChevronRight size={12} className="breadcrumb-separator" />
        {category && (
          <>
            <span onClick={() => setCurrentRoute(`category/${category.slug}`)} style={{ cursor: 'pointer' }}>
              {category.name}
            </span>
            <ChevronRight size={12} className="breadcrumb-separator" />
          </>
        )}
        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{article.title}</span>
      </div>

      {/* Article Header */}
      <div className="article-header">
        <h1 className="article-page-title">{article.title}</h1>
        
        <div className="article-author-info">
          <div className="author-details">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${article.author_name || 'Admin'}`}
              alt={article.author_name}
              className="author-meta-img"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (article.author_id) {
                  setCurrentRoute(`author/${article.author_id}`);
                  window.scrollTo(0, 0);
                }
              }}
            />
            <div>
              <div 
                className="author-name-title"
                style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                onClick={() => {
                  if (article.author_id) {
                    setCurrentRoute(`author/${article.author_id}`);
                    window.scrollTo(0, 0);
                  }
                }}
              >
                {article.author_name}
              </div>
              <div className="post-publish-date">
                Published {formatDate(article.published_at || article.created_at)}
                {article.updated_at && new Date(article.updated_at).getTime() > new Date(article.published_at || article.created_at).getTime() + 10000 && (
                  <span style={{ marginLeft: '8px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    (Updated: {formatDate(article.updated_at)})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="reading-meta">
              <Clock size={14} style={{ marginRight: '4px' }} />
              <span>{article.reading_time}</span>
            </div>
            
            {/* Bookmark button */}
            <button
              onClick={isBookmarked ? () => onRemoveBookmark(article.id) : () => onAddBookmark(article.id)}
              className="btn btn-outline"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                borderColor: isBookmarked ? 'var(--primary)' : 'var(--border-color)',
                color: isBookmarked ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: isBookmarked ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                transition: 'all var(--transition-fast)'
              }}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            >
              <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
              <span>{isBookmarked ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <img 
        src={article.image_url || FALLBACK_IMAGE} 
        alt={article.title} 
        className="article-hero-img" 
      />

      {article.is_sponsored && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              backgroundColor: '#ef4444',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Sponsored</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              This content is brought to you by <strong>{article.sponsor_name || 'our sponsor'}</strong>.
            </span>
          </div>
          {article.sponsor_logo && (
            <img
              src={article.sponsor_logo}
              alt={article.sponsor_name}
              style={{ maxHeight: '32px', objectFit: 'contain', maxWidth: '120px' }}
            />
          )}
        </div>
      )}

      {/* Table of Contents */}
      {headings.length > 0 && (
        <div className="toc-container">
          <h4 className="toc-title">Table of Contents</h4>
          <ul className="toc-list">
            {headings.map((h, i) => {
              const isActive = activeId === h.id;
              return (
                <li 
                  key={i} 
                  className={`toc-item ${isActive ? 'active' : ''}`} 
                  style={{ 
                    paddingLeft: h.level === 3 ? '16px' : '0',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                >
                  <a 
                    href={`#${h.id}`}
                    onClick={(e) => handleTocClick(e, h.id)}
                    style={{
                      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? '600' : '400',
                      paddingLeft: '8px',
                      display: 'block',
                      transition: 'all 0.2s ease',
                      textDecoration: 'none'
                    }}
                  >
                    {h.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* In-Article Header Ad Placement */}
      {settings.showInArticleAds && (
        <div className="ad-slot" style={{ margin: '0 0 28px' }}>
          <span className="ad-badge">SPONSORED</span>
          <div style={{ padding: '12px', fontSize: '0.75rem' }}>
            <p style={{ fontWeight: '500' }}>Google AdSense In-Article Billboard Placement</p>
            <code style={{ fontSize: '0.7rem' }}>slot="top_article_728x90"</code>
          </div>
        </div>
      )}

      {/* Article Body Content */}
      <div className="article-body-content">
        {renderArticleBody(article.content)}
      </div>


      {/* Tags and Share Row */}
      <div className="article-tags-share">
        <div className="article-tags">
          {article.tags && article.tags.map((tag, i) => (
            <span key={i} className="tag-btn">#{tag}</span>
          ))}
        </div>

        <div className="social-share-group">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '4px' }}>SHARE:</span>
          
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' - ' + window.location.href)}`}
            target="_blank"
            rel="noreferrer"
            className="share-btn"
            title="Share on WhatsApp"
            style={{ color: '#25D366' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.709 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>

          <button
            onClick={handleCopyLink}
            className="share-btn"
            title="Copy URL"
          >
            {linkCopied ? <Check size={14} /> : <Link size={14} />}
          </button>
        </div>
      </div>

      {/* Bottom Ad Placement */}
      {settings.showInArticleAds && (
        <div className="ad-slot" style={{ margin: '28px 0' }}>
          <span className="ad-badge">SPONSORED</span>
          <div style={{ padding: '12px', fontSize: '0.75rem' }}>
            <p style={{ fontWeight: '500' }}>Google AdSense In-Article Box Placement</p>
            <code style={{ fontSize: '0.7rem' }}>slot="bottom_article_300x250"</code>
          </div>
        </div>
      )}

      {/* About the Author card */}
      <div 
        style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          textAlign: 'left'
        }}
      >
        <img
          src={article.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${article.author_name || 'Admin'}`}
          alt={article.author_name}
          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => {
            if (article.author_id) {
              setCurrentRoute(`author/${article.author_id}`);
              window.scrollTo(0, 0);
            }
          }}
        />
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '800' }}>
            About the Author:{' '}
            <span 
              style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => {
                if (article.author_id) {
                  setCurrentRoute(`author/${article.author_id}`);
                  window.scrollTo(0, 0);
                }
              }}
            >
              {article.author_name || 'Admin'}
            </span>
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {article.author_bio || 'Contributor at DigiLokam. Sharing tech tutorials, mobile tips, and latest digital insights.'}
          </p>
        </div>
      </div>

      {/* Related Articles Row */}
      {relatedArticles.length > 0 && (
        <section style={{ marginTop: '48px', borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.015em' }}>Related Articles</h3>
          <div className="grid-2">
            {relatedArticles.map(rel => (
              <div key={rel.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-img-wrap" style={{ height: '130px' }}>
                  <img 
                    src={rel.image_url || FALLBACK_IMAGE} 
                    alt={rel.title} 
                    className="card-img" 
                    loading="lazy"
                  />
                </div>
                <div className="card-content" style={{ padding: '16px' }}>
                  <a
                    href={`/article/${rel.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentRoute(`article/${rel.slug}`);
                    }}
                    style={{ fontWeight: '700', fontSize: '0.9rem', lineHeight: '1.4' }}
                  >
                    {rel.title}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="comments-container">
        <h3 className="comments-header-title">
          <MessageSquare size={16} />
          Comments ({comments.length})
        </h3>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <h4 className="form-title">Leave a Reply</h4>
          
          {commentSuccess && (
            <div className="alert alert-success">Comment successfully posted!</div>
          )}

          <div className="form-group-grid">
            <input
              type="text"
              placeholder="Name"
              value={newCommentName}
              onChange={(e) => setNewCommentName(e.target.value)}
              className="form-control"
              required
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <textarea
              placeholder="Type your comment here..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="form-control"
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.875rem' }}>
            <span>Submit Comment</span>
            <Send size={12} />
          </button>
        </form>

        {/* Comments List */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>
              Be the first to leave a comment!
            </p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="comment-card">
                <div className="comment-meta">
                  <div className="comment-author-info">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${c.author_name}`}
                      alt={c.author_name}
                      className="comment-author-avatar"
                    />
                    <span>{c.author_name}</span>
                  </div>
                  <span className="comment-date">
                    {new Date(c.created_at).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="comment-body">{c.content}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}
