update public.strategies
set
  enabled = slug in ('cash_secured_put', 'covered_call'),
  thresholds = case slug
    when 'cash_secured_put' then '{"min_iv_percentile":35,"target_delta":0.22,"min_abs_delta":0.20,"max_abs_delta":0.40,"cash_secured_only":true,"max_spread_pct":18}'::jsonb
    when 'covered_call' then '{"min_iv_percentile":30,"target_delta":0.25,"min_abs_delta":0.20,"max_abs_delta":0.40,"covered_only":true,"max_spread_pct":18}'::jsonb
    else thresholds
  end,
  updated_at = now();
