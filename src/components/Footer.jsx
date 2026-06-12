import React, { useState } from 'react';
import { Mail, Instagram, Send, CheckCircle } from 'lucide-react';
import { subscriberService } from '../supabase';

export default function Footer({ setCurrentRoute }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await subscriberService.add(email);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      setError(err.message || 'Error subscribing.');
    }
  };

  const handleLinkClick = (e, route) => {
    e.preventDefault();
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="footer">
      <div className="container">
        {/* Footer Top Grid */}
        <div className="footer-grid">
          {/* Brand & Description */}
          <div className="footer-brand">
            <span className="footer-logo">DigiLokam</span>
            <p className="footer-tagline">
              Your Digital Technology Hub. Bringing you reviews, guides, step-by-step tutorials, online earning ideas, and AI tools in simple Malayalam language.
            </p>
            <div className="footer-socials">
              {/* WhatsApp */}
              <a href="https://wa.me/919061354069" target="_blank" rel="noreferrer" className="social-icon" aria-label="WhatsApp">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.709 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="footer-title">Categories</h4>
            <div className="footer-links">
              <a href="/category/ai-tools" onClick={(e) => handleLinkClick(e, 'category/ai-tools')} className="footer-link">AI Tools</a>
              <a href="/category/tech-tutorials" onClick={(e) => handleLinkClick(e, 'category/tech-tutorials')} className="footer-link">Tech Tutorials</a>
              <a href="/category/mobile-tips" onClick={(e) => handleLinkClick(e, 'category/mobile-tips')} className="footer-link">Mobile Tips</a>
              <a href="/category/online-earning" onClick={(e) => handleLinkClick(e, 'category/online-earning')} className="footer-link">Online Earning</a>
              <a href="/social-tools" onClick={(e) => handleLinkClick(e, 'social-tools')} className="footer-link">Social Tools</a>
            </div>
          </div>

          {/* Static Pages Links */}
          <div>
            <h4 className="footer-title">Quick Links</h4>
            <div className="footer-links">
              <a href="/about" onClick={(e) => handleLinkClick(e, 'about')} className="footer-link">About Us</a>
              <a href="/contact" onClick={(e) => handleLinkClick(e, 'contact')} className="footer-link">Contact Us</a>
              <a href="/privacy" onClick={(e) => handleLinkClick(e, 'privacy')} className="footer-link">Privacy Policy</a>
            </div>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="footer-title">Newsletter</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.5' }}>
              Subscribe to get the latest tech insights and AI tool reviews delivered straight to your inbox.
            </p>
            {subscribed ? (
              <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
                <CheckCircle size={16} />
                <span>Subscription successful!</span>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <Send size={14} />
                  </button>
                </form>
                {error && (
                  <div className="alert alert-danger" style={{ marginTop: '8px', padding: '6px', fontSize: '0.75rem' }}>
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div className="footer-bottom">
          <span>&copy; 2026 DigiLokam. All Rights Reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/privacy" onClick={(e) => handleLinkClick(e, 'privacy')} className="footer-link">Privacy Policy</a>
            <a href="/contact" onClick={(e) => handleLinkClick(e, 'contact')} className="footer-link">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
