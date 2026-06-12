import React, { useState } from 'react';
import { Youtube, QrCode, Type, Download, HelpCircle, Copy, Check } from 'lucide-react';

export default function SocialTools() {
  const [activeTool, setActiveTool] = useState('youtube'); // 'youtube' | 'qr' | 'counter'

  // Tool 1: YouTube Thumbnail Downloader State
  const [ytUrl, setYtUrl] = useState('');
  const [ytVideoId, setYtVideoId] = useState(null);
  const [ytError, setYtError] = useState(null);

  // Tool 2: QR Code State
  const [qrText, setQrText] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);

  // Tool 3: Counter State
  const [textInput, setTextInput] = useState('');

  // YouTube Extraction logic
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYtSubmit = (e) => {
    e.preventDefault();
    setYtError(null);
    setYtVideoId(null);

    const videoId = extractVideoId(ytUrl);
    if (videoId) {
      setYtVideoId(videoId);
    } else {
      setYtError('Invalid YouTube URL! Please enter a valid watch or share link.');
    }
  };

  // QR Code Generation
  const handleQrSubmit = (e) => {
    e.preventDefault();
    if (qrText.trim()) {
      setQrGenerated(true);
    }
  };

  // Word Counter Stats
  const getStats = () => {
    const text = textInput.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = textInput.length;
    const charsNoSpace = textInput.replace(/\s+/g, '').length;
    const paragraphs = textInput.split('\n').filter(p => p.trim().length > 0).length;

    return { words, chars, charsNoSpace, paragraphs };
  };

  const stats = getStats();

  return (
    <div className="anim-fade-in" style={{ marginBottom: '60px' }}>
      {/* Page Hero */}
      <div className="page-hero" style={{ padding: '36px 0' }}>
        <h1 className="page-title">Social Content Tools</h1>
        <p className="page-subtitle">Free online utilities for content creators and social media marketers</p>
      </div>

      {/* Tool Selection Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTool('youtube')}
          className={`btn ${activeTool === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Youtube size={16} />
          <span>YouTube Thumbnail Downloader</span>
        </button>

        <button
          onClick={() => setActiveTool('qr')}
          className={`btn ${activeTool === 'qr' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <QrCode size={16} />
          <span>QR Code Generator</span>
        </button>

        <button
          onClick={() => setActiveTool('counter')}
          className={`btn ${activeTool === 'counter' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Type size={16} />
          <span>Word & Character Counter</span>
        </button>
      </div>

      {/* Tools Content Wrapper */}
      <div className="page-content-wrapper" style={{ maxWidth: '900px' }}>
        
        {/* Tool 1: YouTube Thumbnail Downloader */}
        {activeTool === 'youtube' && (
          <div className="anim-slide-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Youtube size={22} style={{ color: 'red' }} />
              YouTube Thumbnail Downloader
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Enter any YouTube video link (watch link, mobile share link, or embed link) below to retrieve and download high-resolution cover thumbnails instantly.
            </p>

            <form onSubmit={handleYtSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                className="form-control"
                required
              />
              <button type="submit" className="btn btn-primary">
                Extract
              </button>
            </form>

            {ytError && <div className="alert alert-danger">{ytError}</div>}

            {ytVideoId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Extracted Thumbnail Sizes:</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  
                  {/* HD Thumbnail */}
                  <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)' }}>Maximum Resolution (HD 1080p)</h4>
                    <img 
                      src={`https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg`} 
                      alt="HD Thumbnail" 
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', aspectRatio: '16/9', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback to hq if maxres is missing
                        e.target.onerror = null;
                        e.target.src = `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`;
                      }}
                    />
                    <a
                      href={`https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px', marginTop: 'auto' }}
                    >
                      <Download size={14} />
                      Download HD Image
                    </a>
                  </div>

                  {/* Standard Thumbnail */}
                  <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)' }}>Standard Quality (HQ 720p)</h4>
                    <img 
                      src={`https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`} 
                      alt="HQ Thumbnail" 
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', aspectRatio: '16/9', objectFit: 'cover' }}
                    />
                    <a
                      href={`https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                      style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px', marginTop: 'auto' }}
                    >
                      <Download size={14} />
                      Download HQ Image
                    </a>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* Tool 2: QR Code Generator */}
        {activeTool === 'qr' && (
          <div className="anim-slide-up" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <QrCode size={22} style={{ color: 'var(--primary)' }} />
              QR Code Generator
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px', lineHeight: '1.5' }}>
              Generate custom QR Codes for website URLs, contact info, plain texts, or Wi-Fi passwords. Enter your data below to create a high-quality QR code.
            </p>

            <form onSubmit={handleQrSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto 30px' }}>
              <input
                type="text"
                placeholder="Enter text or URL here..."
                value={qrText}
                onChange={(e) => { setQrText(e.target.value); setQrGenerated(false); }}
                className="form-control"
                required
              />
              <button type="submit" className="btn btn-primary">
                Generate
              </button>
            </form>

            {qrGenerated && qrText.trim() && (
              <div className="card" style={{ display: 'inline-flex', flexDirection: 'column', gap: '16px', padding: '24px', margin: '0 auto', maxWidth: '300px' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrText)}`}
                  alt="QR Code"
                  style={{ width: '200px', height: '200px', border: '1px solid var(--border-color)', padding: '10px', background: '#ffffff', margin: '0 auto' }}
                />
                <div style={{ wordBreak: 'break-all', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Data: <strong>{qrText}</strong>
                </div>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  <Download size={14} />
                  Open High-Res QR
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tool 3: Character & Word Counter */}
        {activeTool === 'counter' && (
          <div className="anim-slide-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Type size={22} style={{ color: 'var(--secondary)' }} />
              Word & Character Counter
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Write or paste your article, blog post, or social media caption below. The counter updates real-time analytics for characters, words, and paragraphs.
            </p>

            <textarea
              placeholder="Paste your content here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="form-control"
              style={{ minHeight: '180px', marginBottom: '24px', fontSize: '0.95rem', fontFamily: 'sans-serif' }}
            ></textarea>

            {/* Metrics cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              
              <div className="card" style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.words}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Words</div>
              </div>

              <div className="card" style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.chars}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Characters</div>
              </div>

              <div className="card" style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.charsNoSpace}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>No Spaces</div>
              </div>

              <div className="card" style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.paragraphs}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paragraphs</div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
