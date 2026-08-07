insert into public.strategies (slug, name, type, risk_level, thresholds) values
  ('buy_call', 'Buy Call', 'basic_directional', 'balanced', '{"max_iv_percentile":68,"target_delta":0.55,"min_alignment":64}'),
  ('buy_put', 'Buy Put', 'basic_directional', 'balanced', '{"max_iv_percentile":70,"target_delta":0.55,"min_alignment":64}'),
  ('cash_secured_put', 'Cash Secured Put', 'income', 'balanced', '{"min_iv_percentile":35,"target_delta":0.22,"min_abs_delta":0.20,"max_abs_delta":0.40,"cash_secured_only":true,"max_spread_pct":18}'),
  ('covered_call', 'Covered Call', 'income', 'balanced', '{"min_iv_percentile":30,"target_delta":0.25,"min_abs_delta":0.20,"max_abs_delta":0.40,"covered_only":true,"max_spread_pct":18}'),
  ('bull_put_credit_spread', 'Bull Put Credit Spread', 'defined_risk_income', 'balanced', '{"min_iv_percentile":38,"target_delta":0.22,"max_spread_pct":18}'),
  ('bear_call_credit_spread', 'Bear Call Credit Spread', 'defined_risk_income', 'balanced', '{"min_iv_percentile":38,"target_delta":0.22,"max_spread_pct":18}'),
  ('bull_call_debit_spread', 'Bull Call Debit Spread', 'directional', 'aggressive', '{"max_iv_percentile":72,"target_delta":0.48,"max_spread_pct":18}'),
  ('bear_put_debit_spread', 'Bear Put Debit Spread', 'directional', 'aggressive', '{"max_iv_percentile":72,"target_delta":0.48,"max_spread_pct":18}'),
  ('iron_condor', 'Iron Condor', 'range_income', 'conservative', '{"min_iv_percentile":45,"target_delta":0.18,"max_atr_percent":4.2}'),
  ('directional_call', 'Directional Call', 'directional', 'aggressive', '{"max_iv_percentile":58,"target_delta":0.55,"min_alignment":72}'),
  ('directional_put', 'Directional Put', 'directional', 'aggressive', '{"max_iv_percentile":60,"target_delta":0.55,"min_alignment":72}')
on conflict (slug) do nothing;
