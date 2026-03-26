export default function AffiliateCard({ title, description, benefits = [], ctaText, affiliateUrl, onClick }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '18px' }}>
      <h4 className="font-display font-bold text-xl mb-2">{title}</h4>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6 }} className="mb-3">{description}</p>
      <ul className="mb-4" style={{ paddingLeft: '18px', color: 'var(--ink)' }}>
        {benefits.map((benefit) => (
          <li key={benefit} className="text-sm mb-1">{benefit}</li>
        ))}
      </ul>
      <a
        href={affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
        style={{
          display: 'inline-block',
          background: 'var(--ink)',
          color: 'var(--gold)',
          padding: '10px 14px',
          textDecoration: 'none',
          fontFamily: 'inherit',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          borderRadius: '2px',
        }}
      >
        {ctaText}
      </a>
    </div>
  );
}
