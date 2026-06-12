import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ArticlePage from './pages/ArticlePage';
import SearchPage from './pages/SearchPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import SocialTools from './pages/SocialTools';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AuthorPage from './pages/AuthorPage';
import { articleService, categoryService, settingsService, authService, bookmarkService, migrateLocalStorageToSupabase, errorLogService, affiliateService } from './supabase';

export default function App() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPushOptIn, setShowPushOptIn] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [currentRoute, setCurrentRoute] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute visible public articles (excluding drafts and scheduled posts)
  const publicArticles = articles.filter(art => 
    !art.is_draft && 
    (!art.published_at || new Date(art.published_at) <= new Date())
  );

  // 1. Initial State Loading
  useEffect(() => {
    const loadData = async () => {
      try {
        const [arts, cats, sets, currentUser] = await Promise.all([
          articleService.getAll(),
          categoryService.getAll(),
          settingsService.get(),
          authService.getCurrentUser()
        ]);
        setArticles(arts);
        setCategories(cats);
        setSettings(sets);
        setUser(currentUser);
        console.log('[App] Initial auth state:', currentUser ? `${currentUser.email} (${currentUser.role})` : 'not logged in');
      } catch (e) {
        console.error("Error loading application seed data:", e);
      } finally {
        setAuthLoading(false);
      }
    };
    loadData();
  }, []);

  // 1.2 One-time client-side migration when Admin logs in
  useEffect(() => {
    const triggerMigration = async () => {
      if (user && user.role === 'admin') {
        try {
          await migrateLocalStorageToSupabase();
          // Reload articles and categories after migration to update state
          const [arts, cats] = await Promise.all([
            articleService.getAll(),
            categoryService.getAll()
          ]);
          setArticles(arts);
          setCategories(cats);
        } catch (e) {
          console.error("Failed to migrate data on login:", e);
        }
      }
    };
    triggerMigration();
  }, [user]);

  // 1.5. Bookmarks Loading Hook
  useEffect(() => {
    const loadBookmarks = async () => {
      if (user) {
        try {
          const userBookmarks = await bookmarkService.getBookmarks(user.id);
          setBookmarks(userBookmarks);
        } catch (e) {
          console.error("Error loading bookmarks:", e);
        }
      } else {
        setBookmarks([]);
      }
    };
    loadBookmarks();
  }, [user]);

  // 2. Pathname Routing Handler & Navigator Helper
  const getSearchQueryFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  };

  const getRouteFromPathname = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      return 'home';
    }
    if (path === '/search' || path.startsWith('/search')) {
      return 'search';
    }
    return path.substring(1);
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPathname();
      setCurrentRoute(route);
      if (route === 'search') {
        setSearchQuery(getSearchQueryFromUrl());
      } else {
        setSearchQuery('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Run once on load

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSetRoute = (route) => {
    let path = route === 'home' ? '/' : `/${route}`;
    if (route === 'search') {
      path = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState(null, '', path);
    }
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  // 3. Forced Light Mode Reset
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Global Unhandled Error Logging Hook
  useEffect(() => {
    const handleGlobalError = (event) => {
      errorLogService.log(
        event.message || 'Unhandled error occurred',
        event.error?.stack || '',
        'Global Window Error'
      ).catch(console.error);
    };

    const handleUnhandledRejection = (event) => {
      errorLogService.log(
        event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
        event.reason?.stack || '',
        'Global Promise Rejection'
      ).catch(console.error);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Affiliate Redirect Handler
  useEffect(() => {
    if (currentRoute.startsWith('go/')) {
      const slug = currentRoute.split('/')[1];
      const performRedirect = async () => {
        try {
          const links = await affiliateService.getAll();
          const link = links.find(l => l.slug === slug);
          if (link) {
            await affiliateService.trackClick(slug);
            window.location.replace(link.target_url);
          } else {
            console.error('[Affiliate] Link not found for slug:', slug);
            handleSetRoute('home');
          }
        } catch (e) {
          console.error('[Affiliate] Redirect error:', e);
          handleSetRoute('home');
        }
      };
      performRedirect();
    }
  }, [currentRoute]);

  // Push Notification Opt-In Timer Effect
  useEffect(() => {
    if (!currentRoute.startsWith('admin') && localStorage.getItem('digilokam_push_subscribed') !== 'true') {
      const timer = setTimeout(() => {
        setShowPushOptIn(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowPushOptIn(false);
    }
  }, [currentRoute]);

  // 4. Logout Handler
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await authService.signOut();
        setUser(null);
        setBookmarks([]);
        handleSetRoute('home');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 4.5 Bookmark Actions
  const handleAddBookmark = async (articleId) => {
    if (!user) {
      handleSetRoute('login');
      return;
    }
    if (!bookmarks.includes(articleId)) {
      const updated = [...bookmarks, articleId];
      setBookmarks(updated);
      await bookmarkService.saveBookmarks(user.id, updated);
    }
  };

  const handleRemoveBookmark = async (articleId) => {
    if (!user) return;
    const updated = bookmarks.filter(id => id !== articleId);
    setBookmarks(updated);
    await bookmarkService.saveBookmarks(user.id, updated);
  };

  // 5. Dynamic SEO Meta Injection
  useEffect(() => {
    if (currentRoute === 'home') {
      document.title = "DigiLokam - Your Digital Technology Hub";
    } else if (currentRoute.startsWith('category/')) {
      const slug = currentRoute.split('/')[1];
      const cat = categories.find(c => c.slug === slug);
      if (cat) document.title = `${cat.name} - DigiLokam | Technology Magazine`;
    } else if (currentRoute.startsWith('article/')) {
      const slug = currentRoute.split('/')[1];
      const art = articles.find(a => a.slug === slug);
      if (art) {
        document.title = `${art.seo_title || art.title} - DigiLokam`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', art.seo_description || art.description);
      }
    } else if (currentRoute.startsWith('author/')) {
      const authorId = currentRoute.split('/')[1];
      const art = articles.find(a => String(a.author_id) === String(authorId));
      const authorName = art?.author_name || 'Author';
      document.title = `Articles by ${authorName} - DigiLokam`;
    } else if (currentRoute === 'about') {
      document.title = "About Us - DigiLokam";
    } else if (currentRoute === 'contact') {
      document.title = "Contact Us - DigiLokam";
    } else if (currentRoute === 'privacy') {
      document.title = "Privacy Policy - DigiLokam";
    } else if (currentRoute === 'social-tools') {
      document.title = "Social Content Tools - DigiLokam";
    } else if (currentRoute === 'register') {
      document.title = "Register - DigiLokam";
    } else if (currentRoute === 'login') {
      document.title = "Login - DigiLokam";
    } else if (currentRoute === 'profile') {
      document.title = "My Account - DigiLokam";
    } else if (currentRoute.startsWith('admin')) {
      document.title = "Admin Dashboard - DigiLokam";
    }
  }, [currentRoute, articles, categories]);

  // 6. Router Renderer
  const renderActivePage = () => {
    if (currentRoute === 'search' || currentRoute.startsWith('search')) {
      return (
        <SearchPage
          articles={publicArticles}
          categories={categories}
          searchQuery={searchQuery}
          setCurrentRoute={handleSetRoute}
        />
      );
    }

    if (currentRoute === 'home') {
      return (
        <Home
          articles={publicArticles}
          categories={categories}
          settings={settings}
          setCurrentRoute={handleSetRoute}
          searchQuery={searchQuery}
        />
      );
    }
    
    if (currentRoute.startsWith('category/')) {
      const categorySlug = currentRoute.split('/')[1];
      return (
        <CategoryPage
          categorySlug={categorySlug}
          articles={publicArticles}
          categories={categories}
          setCurrentRoute={handleSetRoute}
          searchQuery={searchQuery}
        />
      );
    }
    
    if (currentRoute.startsWith('article/')) {
      const articleSlug = currentRoute.split('/')[1];
      return (
        <ArticlePage
          slug={articleSlug}
          articles={articles}
          categories={categories}
          settings={settings}
          setCurrentRoute={handleSetRoute}
          user={user}
          bookmarks={bookmarks}
          onAddBookmark={handleAddBookmark}
          onRemoveBookmark={handleRemoveBookmark}
        />
      );
    }

    if (currentRoute.startsWith('author/')) {
      const authorId = currentRoute.split('/')[1];
      return (
        <AuthorPage
          authorId={authorId}
          articles={articles}
          setCurrentRoute={handleSetRoute}
        />
      );
    }
    
    if (currentRoute === 'about') return <About />;
    if (currentRoute === 'contact') return <Contact />;
    if (currentRoute === 'privacy') return <Privacy />;
    if (currentRoute === 'social-tools') return <SocialTools />;
    if (currentRoute === 'register') return <Register setCurrentRoute={handleSetRoute} />;
    
    if (currentRoute === 'login') {
      if (user) {
        return (
          <UserProfile
            user={user}
            setUser={setUser}
            onLogout={handleLogout}
            bookmarks={bookmarks}
            articles={articles}
            onRemoveBookmark={handleRemoveBookmark}
            setCurrentRoute={handleSetRoute}
          />
        );
      }
      return <Login setUser={setUser} setCurrentRoute={handleSetRoute} />;
    }

    if (currentRoute === 'profile') {
      if (!user) return <Login setUser={setUser} setCurrentRoute={handleSetRoute} />;
      return (
        <UserProfile
          user={user}
          setUser={setUser}
          onLogout={handleLogout}
          bookmarks={bookmarks}
          articles={articles}
          onRemoveBookmark={handleRemoveBookmark}
          setCurrentRoute={handleSetRoute}
        />
      );
    }
    
    if (currentRoute === 'admin' || currentRoute.startsWith('admin/')) {
      // Wait for auth check to finish before deciding
      if (authLoading) {
        return (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Verifying session...</p>
          </div>
        );
      }

      if (!user || user.role !== 'admin') {
        console.log('[App] Admin route — no admin user, showing login. user:', user?.email, 'role:', user?.role);
        return <AdminLogin setAdminUser={setUser} setCurrentRoute={handleSetRoute} />;
      }
      
      if (currentRoute === 'admin') {
        setTimeout(() => handleSetRoute('admin/dashboard'), 0);
        return null;
      }
      
      // Map currentRoute to the activeTab
      let tab = 'dashboard';
      if (currentRoute === 'admin/articles') tab = 'articles';
      if (currentRoute === 'admin/categories') tab = 'categories';
      if (currentRoute === 'admin/comments') tab = 'comments';
      if (currentRoute === 'admin/subscribers') tab = 'subscribers';
      if (currentRoute === 'admin/messages') tab = 'messages';
      if (currentRoute === 'admin/users') tab = 'users';
      if (currentRoute === 'admin/monetization') tab = 'monetization';
      if (currentRoute === 'admin/sitemap') tab = 'sitemap';
      if (currentRoute === 'admin/settings') tab = 'settings';
      if (currentRoute === 'admin/logs') tab = 'logs';
      if (currentRoute === 'admin/media') tab = 'media';
      if (currentRoute === 'admin/stories') tab = 'stories';
      if (currentRoute === 'admin/push-notifications') tab = 'push-notifications';

      return (
        <AdminDashboard
          articles={articles}
          setArticles={setArticles}
          categories={categories}
          setCategories={setCategories}
          settings={settings}
          setSettings={setSettings}
          setCurrentRoute={handleSetRoute}
          activeTabProp={tab}
        />
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Page Not Found</h2>
        <button onClick={() => handleSetRoute('home')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Home
        </button>
      </div>
    );
  };

  const showSidebar = currentRoute.startsWith('category/') || currentRoute.startsWith('article/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header component */}
      <Header
        currentRoute={currentRoute}
        setCurrentRoute={handleSetRoute}
        user={user}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Google AdSense Header Placement */}
      {settings.showBannerAds && (
        <div className="container ad-banner-header">
          <div className="ad-slot" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
            <span className="ad-badge">SPONSORED</span>
            <p style={{ fontWeight: '500', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Google AdSense Leaderboard Placement | Client ID: {settings.adsenseClientId}
            </p>
          </div>
        </div>
      )}

      {/* Main Page Layout Grid */}
      {currentRoute === 'home' ? (
        <main style={{ flexGrow: 1, marginBottom: '80px' }}>{renderActivePage()}</main>
      ) : (
        <div className="container" style={{ flexGrow: 1 }}>
          {showSidebar ? (
            <div className="main-layout">
              <main>{renderActivePage()}</main>
              <Sidebar
                articles={publicArticles}
                categories={categories}
                settings={settings}
                setCurrentRoute={handleSetRoute}
              />
            </div>
          ) : (
            <main style={{ marginTop: '40px', marginBottom: '80px' }}>{renderActivePage()}</main>
          )}
        </div>
      )}

      {/* Push Notification sliding banner */}
      {showPushOptIn && (
        <div 
          className="push-optin-banner anim-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            maxWidth: '360px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 16px -8px rgba(0, 0, 0, 0.05)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '8px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary)', borderRadius: '50%', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <div style={{ flexGrow: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: '800' }}>Enable Notifications</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Get real-time updates and push alerts for new technology guides and tutorial articles.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
            <button 
              onClick={() => {
                setShowPushOptIn(false);
              }}
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto' }}
            >
              No Thanks
            </button>
            <button 
              onClick={() => {
                localStorage.setItem('digilokam_push_subscribed', 'true');
                // Increment subscription count
                const count = parseInt(localStorage.getItem('digilokam_push_subscribers_count') || '124', 10);
                localStorage.setItem('digilokam_push_subscribers_count', String(count + 1));
                setShowPushOptIn(false);
                alert('Simulated push notifications enabled! You will now see mock notifications logged in the Admin Panel.');
              }}
              className="btn btn-primary" 
              style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto' }}
            >
              Allow
            </button>
          </div>
        </div>
      )}

      {/* Footer component */}
      <Footer
        setCurrentRoute={handleSetRoute}
      />
    </div>
  );
}
