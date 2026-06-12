import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { contactMessageService, notificationService } from '../supabase';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await contactMessageService.add({
        name,
        email,
        subject,
        message
      });
      // Trigger Admin notification
      notificationService.sendToAdmins(
        'New Contact Message',
        `You have received a new contact message from "${name}" (${email}): "${subject}"`,
        'message'
      ).catch(console.error);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Error sending message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="anim-fade-in" style={{ marginBottom: '60px' }}>
      <div className="page-hero">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">Get in touch with the DigiLokam team</p>
      </div>

      <div className="page-content-wrapper">
        <div className="grid-responsive-split">
          {/* Contact Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Contact Details</h3>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--primary)', marginTop: '4px' }}><Mail size={18} /></div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.9rem' }}>Email Address</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>usmanputtamanna@gmail.com</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--primary)', marginTop: '4px' }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.9rem' }}>WhatsApp / Phone</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>+91 9061354069</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--primary)', marginTop: '4px' }}><MapPin size={18} /></div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.9rem' }}>Address</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Malappuram, Kerala - 673641</p>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '20px' }}>Send Us a Message</h3>
            
            {submitted && (
              <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} />
                <span>Message successfully sent! We will get back to you shortly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-control"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="form-label">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-control"
                  required
                  disabled={submitting}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={submitting}>
                <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
