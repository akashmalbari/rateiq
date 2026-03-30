import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: '3px solid var(--ink)', background: 'var(--cream)' }} className="py-8">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-sm mb-4" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          Figure My Money is a financial decision intelligence platform for housing, lifestyle, and wealth calculators.
        </p>

        <nav aria-label="Footer links" className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--ink)' }}>
          <Link href="/about" className="hover:underline">About</Link>
          <span className="mx-2">|</span>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <span className="mx-2">|</span>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-xs font-mono" style={{ color: 'var(--muted)' }}>
          <div>© 2026 Figure My Money · Not financial advice. For informational purposes only.</div>
          <div>Data sources: FRED/Federal Reserve · Market data may be delayed</div>
        </div>
      </div>
    </footer>
  );
}
