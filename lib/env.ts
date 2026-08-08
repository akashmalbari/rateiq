import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_NAME: z.string().default("Figure My Money"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional()
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  TRADING_ADMIN_USERNAME: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  MARKET_DATA_PROVIDER: z.string().default("demo"),
  POLYGON_API_KEY: z.string().optional(),
  TRADIER_ACCESS_TOKEN: z.string().optional(),
  TRADIER_API_KEY: z.string().optional(),
  TRADER_API_KEY: z.string().optional(),
  TRADIER_BASE_URL: z.string().url().default("https://api.tradier.com/v1"),
  FINNHUB_API_KEY: z.string().optional(),
  NASDAQ_100_SYMBOLS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional()
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

export const serverEnv = serverSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  TRADING_ADMIN_USERNAME: process.env.TRADING_ADMIN_USERNAME,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  MARKET_DATA_PROVIDER: process.env.MARKET_DATA_PROVIDER,
  POLYGON_API_KEY: process.env.POLYGON_API_KEY,
  TRADIER_ACCESS_TOKEN:
    process.env.TRADIER_ACCESS_TOKEN ??
    process.env.TRADIER_API_KEY ??
    process.env.TRADER_API_KEY,
  TRADIER_API_KEY: process.env.TRADIER_API_KEY,
  TRADER_API_KEY: process.env.TRADER_API_KEY,
  TRADIER_BASE_URL: process.env.TRADIER_BASE_URL,
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
  NASDAQ_100_SYMBOLS: process.env.NASDAQ_100_SYMBOLS,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
});

export const isSupabaseConfigured =
  Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const adminEmails = [serverEnv.ADMIN_EMAILS, serverEnv.TRADING_ADMIN_USERNAME]
  .filter(Boolean)
  .flatMap((value) => value!.split(","))
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.includes("@"));

export const resendFrom =
  serverEnv.RESEND_FROM ??
  (serverEnv.RESEND_FROM_EMAIL?.includes("<")
    ? serverEnv.RESEND_FROM_EMAIL
    : serverEnv.RESEND_FROM_EMAIL
      ? `Figure My Money <${serverEnv.RESEND_FROM_EMAIL}>`
      : undefined);

export function requireServerEnv(name: keyof typeof serverEnv) {
  const value = serverEnv[name];
  if (!value) {
    throw new Error(`${name} is required for this operation.`);
  }
  return value;
}
