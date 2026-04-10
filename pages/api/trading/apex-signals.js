import { getSessionFromRequest, hasTradingAccess } from '../../../lib/trading/auth';

export default function handler(req, res) {
  const session = getSessionFromRequest(req);

  if (!hasTradingAccess(session)) {
    res.writeHead(302, { Location: '/trading/login' });
    res.end();
    return;
  }

  res.writeHead(302, { Location: '/trading' });
  res.end();
}
