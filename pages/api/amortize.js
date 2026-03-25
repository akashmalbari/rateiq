// pages/api/amortize.js
import { buildAmortizationSchedule } from '../../lib/marketData';

export default function handler(req, res) {
  const { principal, rate, years } = req.query;
  if (!principal || !rate || !years) {
    return res.status(400).json({ error: 'Missing params: principal, rate, years' });
  }
  const schedule = buildAmortizationSchedule(
    parseFloat(principal),
    parseFloat(rate),
    parseInt(years)
  );
  res.status(200).json(schedule);
}
