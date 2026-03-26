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
    <section className="mt-6" style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '2px', padding: '16px' }}>
      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
        Recommended Financial Tools
      </div>
      <h3 className="font-display font-bold text-2xl mb-4">Helpful next steps for this decision</h3>
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-3">
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
