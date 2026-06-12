import React, { useState, useEffect } from 'react';
import { Search, Menu, X, LogOut, User, Bookmark, ChevronDown, LayoutDashboard } from 'lucide-react';

export default function Header({
  currentRoute,
  setCurrentRoute,
  user,
  onLogout,
  onSearch,
  searchQuery
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    onSearch(val);
    
    if (val.trim()) {
      const searchPath = `/search?q=${encodeURIComponent(val)}`;
      if (currentRoute === 'search') {
        window.history.replaceState(null, '', searchPath);
      } else {
        window.history.pushState(null, '', searchPath);
        setCurrentRoute('search');
      }
    } else {
      if (currentRoute === 'search') {
        window.history.replaceState(null, '', '/');
        setCurrentRoute('home');
      }
    }
  };

  const navItems = [
    { label: 'Home', route: 'home' },
    { label: 'AI Tools', route: 'category/ai-tools' },
    { label: 'Tech Tutorials', route: 'category/tech-tutorials' },
    { label: 'Mobile Tips', route: 'category/mobile-tips' },
    { label: 'Online Earning', route: 'category/online-earning' },
    { label: 'Social Tools', route: 'social-tools' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const closeDropdown = () => setDropdownOpen(false);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [dropdownOpen]);

  const handleNavClick = (route) => {
    setCurrentRoute(route);
    setMobileMenuOpen(false);
  };

  const isActive = (route) => {
    if (currentRoute === route) return 'active';
    if (route !== 'home' && currentRoute.startsWith(route)) return 'active';
    return '';
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      <header className={`header-wrapper ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-container">
          
          {/* Logo - DigiLokam only */}
          <a href="/" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} className="logo-link">
            <span style={{ fontSize: '1.65rem', letterSpacing: '-0.03em', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
              Digi<span style={{ color: 'var(--primary)' }}>Lokam</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="main-nav">
            {navItems.map((item) => (
              <a
                key={item.route}
                href={item.route === 'home' ? '/' : `/${item.route}`}
                onClick={(e) => { e.preventDefault(); handleNavClick(item.route); }}
                className={`nav-link ${isActive(item.route)}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Action Bar */}
          <div className="header-actions">
            
            {/* Desktop Search */}
            <div className="search-box">
              <Search size={16} className="search-icon" style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            {/* Account dropdown button */}
            <div className="header-account-wrapper" style={{ position: 'relative' }}>
              <button
                onClick={toggleDropdown}
                className="account-btn"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: dropdownOpen ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
                title="Account Settings"
              >
                {user ? (
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--primary)' }}>
                    {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : <User size={18} />}
                  </div>
                ) : (
                  <User size={18} />
                )}
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div 
                  className="dropdown-menu-card"
                  style={{
                    position: 'absolute',
                    top: '50px',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 16px -8px rgba(0, 0, 0, 0.05)',
                    width: '220px',
                    padding: '8px 0',
                    zIndex: 200,
                    animation: 'anim-fade-in var(--transition-fast)'
                  }}
                >
                  {user ? (
                    <>
                      <div style={{ padding: '10px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px', fontSize: '0.85rem' }}>
                          {user.full_name}
                        </div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </div>
                      </div>
                      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                      
                      {user.role === 'admin' && (
                        <button
                          onClick={() => handleNavClick('admin')}
                          className="dropdown-item"
                          style={{ fontWeight: '600', color: 'var(--primary)' }}
                        >
                          <LayoutDashboard size={14} />
                          <span>Admin Dashboard</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleNavClick('profile')}
                        className="dropdown-item"
                      >
                        <User size={14} />
                        <span>My Account</span>
                      </button>
                      
                      <button
                        onClick={() => handleNavClick('profile')}
                        className="dropdown-item"
                      >
                        <Bookmark size={14} />
                        <span>Bookmarks</span>
                      </button>



                      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                      
                      <button
                        onClick={onLogout}
                        className="dropdown-item"
                        style={{ color: 'var(--danger)' }}
                      >
                        <LogOut size={14} />
                        <span>Log out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNavClick('login')}
                        className="dropdown-item"
                      >
                        <User size={14} />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('register')}
                        className="dropdown-item"
                      >
                        <User size={14} />
                        <span>Create Account</span>
                      </button>
                      

                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="menu-trigger"
              aria-label="Open Mobile Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <span style={{ fontSize: '1.45rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
              Digi<span style={{ color: 'var(--primary)' }}>Lokam</span>
            </span>
            <button onClick={() => setMobileMenuOpen(false)} className="drawer-close">
              <X size={16} />
            </button>
          </div>

          {/* Mobile Search */}
          <div className="drawer-search">
            <Search size={16} className="search-icon" style={{ top: '12px', left: '12px' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="drawer-search-input"
            />
          </div>

          {/* Mobile Nav Links */}
          <nav className="drawer-links">
            {navItems.map((item) => (
              <a
                key={item.route}
                href={item.route === 'home' ? '/' : `/${item.route}`}
                onClick={(e) => { e.preventDefault(); handleNavClick(item.route); }}
                className={`drawer-link ${isActive(item.route)}`}
              >
                {item.label}
              </a>
            ))}
            
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }}></div>
            {user ? (
              <>
                <a
                  href="/profile"
                  onClick={(e) => { e.preventDefault(); handleNavClick('profile'); }}
                  className={`drawer-link ${isActive('profile')}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <User size={16} />
                  My Account
                </a>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="drawer-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}
                >
                  <LogOut size={16} />
                  Logout
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => { e.preventDefault(); handleNavClick('login'); }}
                  className={`drawer-link ${isActive('login')}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <User size={16} />
                  Login / Register
                </a>

              </>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
