import React from 'react';

export default function Privacy() {
  return (
    <div className="anim-fade-in" style={{ marginBottom: '60px' }}>
      <div className="page-hero">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">DigiLokam Privacy Policy</p>
      </div>

      <div className="page-content-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.925rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          <p>
            Your privacy is extremely important to us. This Privacy Policy describes how DigiLokam collects, uses, and protects your personal information when you use our website.
          </p>

          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '16px', color: 'var(--text-primary)' }}>1. Information We Collect</h2>
          <p>
            We collect personal information such as your name and email address when you voluntarily sign up for our newsletter subscription or submit comments on our articles.
          </p>

          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '16px', color: 'var(--text-primary)' }}>2. How We Use Your Information</h2>
          <p>
            The collected information is used solely to deliver new articles, AI tool updates, and digital earning resources directly to your inbox. We do not sell, trade, or share your data with third parties.
          </p>

          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '16px', color: 'var(--text-primary)' }}>3. Google AdSense & Cookies</h2>
          <p>
            We display advertisements from Google AdSense on our blog. Google uses cookies (like the DART cookie) to serve ads to our users based on their visits to our site and other sites on the internet.
          </p>

          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '16px', color: 'var(--text-primary)' }}>4. Security</h2>
          <p>
            We implement appropriate technical security parameters to safeguard your personal details and prevent unauthorized access or system hacking.
          </p>
        </div>
      </div>
    </div>
  );
}
