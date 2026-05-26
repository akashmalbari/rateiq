insert into public.strategies (slug, name, type, risk_level, thresholds) values
  ('buy_call', 'Buy Call', 'basic_directional', 'balanced', '{"max_iv_percentile":68,"target_delta":0.55,"min_alignment":64}'),
  ('sell_call', 'Sell Call', 'basic_income', 'balanced', '{"min_iv_percentile":30,"target_delta":0.25,"covered_only":true,"max_spread_pct":18}'),
  ('buy_put', 'Buy Put', 'basic_directional', 'balanced', '{"max_iv_percentile":70,"target_delta":0.55,"min_alignment":64}'),
  ('sell_put', 'Sell Put', 'basic_income', 'balanced', '{"min_iv_percentile":35,"target_delta":0.22,"cash_secured_only":true,"max_spread_pct":18}')
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  risk_level = excluded.risk_level,
  thresholds = excluded.thresholds,
  enabled = true,
  updated_at = now();

update public.strategies
set enabled = false, updated_at = now()
where slug in ('cash_secured_put', 'covered_call', 'directional_call', 'directional_put');
