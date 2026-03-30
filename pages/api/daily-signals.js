import { getDailySignalsReport } from '../../lib/trading/daily-report';

export default async function handler(req, res) {
  try {
    const report = await getDailySignalsReport();
    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to build daily signals' });
  }
}
