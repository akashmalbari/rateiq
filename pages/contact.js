import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import SiteFooter from '../components/SiteFooter';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export default function ContactPage() {
  const title = 'Contact Figure My Money';
  const description = 'Contact Figure My Money. Send us feedback, support questions, or suggestions for new calculators.';

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit message');
      }

      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (submitError) {
      setStatus('error');
      setError(submitError.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />

        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />

          <h1 className="text-4xl font-display font-bold mb-3">Contact Us</h1>
          <p className="mb-8" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
            Have a question or suggestion? Send us a message.
          </p>

          <form onSubmit={onSubmit} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '22px' }}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                Name
              </label>
              <input id="name" required value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                Email
              </label>
              <input id="email" type="email" required value={form.email} onChange={(e) => updateField('email', e.target.value)} />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
                style={{ width: '100%', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: '2px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              style={{ background: 'var(--ink)', color: 'var(--gold)', padding: '12px 24px', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              {status === 'submitting' ? 'Submitting...' : 'Send message'}
            </button>

            {status === 'success' ? (
              <p className="mt-4" style={{ color: 'var(--green)' }}>Thanks! Your message has been received.</p>
            ) : null}

            {status === 'error' ? (
              <p className="mt-4" style={{ color: 'var(--red)' }}>{error || 'Unable to submit right now.'}</p>
            ) : null}
          </form>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
