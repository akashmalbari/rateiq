import { useMemo } from 'react';
import AffiliateCard from './AffiliateCard';
import AffiliateDisclaimer from './AffiliateDisclaimer';
import { affiliateConfig } from '../../lib/affiliateConfig';

function getPriorityIntent(recommendation = '', winner = '') {
  const source = `${recommendation} ${winner}`.toLowerCase();
  if (source.includes('rent')) return 'rent';
  if (source.includes('buy')) return 'buy';
  if (source.includes('mortgage')) return 'mortgage';
  if (source.includes('invest')) return 'invest';
  if (source.includes('lease')) return 'lease';
  if (source.includes('childcare')) return 'childcare';
  if (source.includes('stay-home') || source.includes('stay home')) return 'stay-home';
  if (source.includes('debt')) return 'debt';
  if (source.includes('dca') || source.includes('sip')) return 'dca';
  if (source.includes('lump')) return 'lump-sum';
  return '';
}

export default function AffiliateSection({ category, decisionType, recommendation, winner }) {
  const offers = affiliateConfig?.[category]?.[decisionType] || [];

  const orderedOffers = useMemo(() => {
    const priorityIntent = getPriorityIntent(recommendation, winner);
    if (!priorityIntent) return offers;

    return [...offers].sort((a, b) => {
      const aMatch = a.intent === priorityIntent ? 0 : 1;
      const bMatch = b.intent === priorityIntent ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [offers, recommendation, winner]);

  if (!orderedOffers.length) return null;

  return (
    <section className="surface-card mt-8 p-6 md:p-7">
      <div className="eyebrow mb-3">Recommended financial tools</div>
      <h3 className="font-display font-semibold text-2xl md:text-3xl mb-3">Helpful next steps for this decision</h3>
      <p className="mb-6 max-w-3xl" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
        These partner links stay relevant to the current recommendation and remain clearly labeled so you can decide whether any option is actually useful.
      </p>
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4">
        {orderedOffers.map((offer) => (
          <AffiliateCard
            key={`${decisionType}-${offer.title}`}
            {...offer}
            onClick={() => console.log('affiliate_click', { category, decisionType, offer: offer.title })}
          />
        ))}
      </div>
      <AffiliateDisclaimer />
    </section>
  );
}
