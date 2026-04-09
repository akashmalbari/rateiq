export default function AffiliateCard({ title, description, benefits = [], ctaText, affiliateUrl, onClick }) {
  return (
    <div className="surface-muted p-5 md:p-6">
      <div className="eyebrow mb-3">Partner tool</div>
      <h4 className="font-display font-semibold text-xl md:text-2xl mb-3">{title}</h4>
      <p style={{ color: 'var(--muted)', lineHeight: 1.75 }} className="mb-4">
        {description}
      </p>
      <ul className="info-list space-y-2 mb-5 text-sm" style={{ color: 'var(--ink)' }}>
        {benefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
      <a
        href={affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
        className="glass-button"
      >
        {ctaText}
      </a>
    </div>
  );
}
