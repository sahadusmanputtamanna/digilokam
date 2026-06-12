import React from 'react';
import { Sparkles, Users, Award, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <div className="anim-fade-in" style={{ marginBottom: '60px' }}>
      <div className="page-hero">
        <h1 className="page-title">About Us</h1>
        <p className="page-subtitle">Your Digital Technology Hub - DigiLokam</p>
      </div>

      <div className="page-content-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
            Information Technology and Artificial Intelligence are rapidly shaping our lives. <strong>DigiLokam</strong> aims to make tech and AI advancements accessible to Malayalam speakers. Our mission is to share the latest tech updates, tutorials, and online resources in a simple, readable format.
          </p>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '20px 0' }}></div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Our Key Focus Areas</h2>
          
          <div className="grid-responsive-2" style={{ marginTop: '10px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ color: 'var(--secondary)', marginBottom: '12px' }}><Sparkles size={28} /></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>AI Tools & Innovations</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Guides and reviews on generative models (ChatGPT, Midjourney, etc.) and free productivity tools.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '12px' }}><Award size={28} /></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Online Earning</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Reliable insights into freelancing, content writing, blogging, and affiliate marketing.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '12px' }}><ShieldCheck size={28} /></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Mobile Tips</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Device optimization hacks, battery protection guidelines, and cyber security safeguards.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ color: 'var(--success)', marginBottom: '12px' }}><Users size={28} /></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>Social & Free Tools</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Curation of free online applications, software resources, and video editor reviews.
              </p>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '20px 0' }}></div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Our Goal</h2>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            To empower students, professionals, and homemakers in Kerala with digital literacy and up-to-date IT trends, helping them discover new career and income opportunities in the modern internet economy.
          </p>
        </div>
      </div>
    </div>
  );
}
