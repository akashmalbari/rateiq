// pages/api/rates.js
import { getLiveRates } from '../../lib/marketData';

export default async function handler(req, res) {
  try {
    const rates = await getLiveRates();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(rates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
}
