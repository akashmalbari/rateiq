import fs from 'fs';
import path from 'path';
import { getSessionFromRequest, hasTradingAccess } from '../../../lib/trading/auth';

export default function handler(req, res) {
  const session = getSessionFromRequest(req);

  if (!hasTradingAccess(session)) {
    res.status(401).send('Unauthorized');
    return;
  }

  const filePath = path.join(process.cwd(), 'lib', 'trading', 'apex_signals.html');
  const html = fs.readFileSync(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
