create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Create these Vault secrets once before relying on the schedules:
-- select vault.create_secret('https://figuremymoney.com', 'figure_my_money_app_url');
-- select vault.create_secret('YOUR_EXISTING_VERCEL_CRON_SECRET', 'figure_my_money_cron_secret');

do $$
declare
  v_job record;
begin
  for v_job in
    select jobid from cron.job
    where jobname in (
      'figure-my-money-daily-scan-edt',
      'figure-my-money-daily-scan-est',
      'figure-my-money-paper-monitor'
    )
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'figure-my-money-daily-scan-edt',
  '30 14 * * 1-5',
  $$
  select net.http_get(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'figure_my_money_app_url'
    ) || '/api/scans/daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'figure_my_money_cron_secret'
      )
    ),
    timeout_milliseconds := 55000
  );
  $$
);

select cron.schedule(
  'figure-my-money-daily-scan-est',
  '30 15 * * 1-5',
  $$
  select net.http_get(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'figure_my_money_app_url'
    ) || '/api/scans/daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'figure_my_money_cron_secret'
      )
    ),
    timeout_milliseconds := 55000
  );
  $$
);

select cron.schedule(
  'figure-my-money-paper-monitor',
  '*/15 14-21 * * 1-5',
  $$
  select net.http_get(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'figure_my_money_app_url'
    ) || '/api/paper/monitor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'figure_my_money_cron_secret'
      )
    ),
    timeout_milliseconds := 55000
  );
  $$
);
