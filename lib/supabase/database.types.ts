export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          subscription_tier: "free" | "premium" | "enterprise";
          email_digest_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          subscription_tier?: "free" | "premium" | "enterprise";
          email_digest_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      scans: {
        Row: {
          id: string;
          scan_date: string;
          started_at: string;
          completed_at: string | null;
          status: "queued" | "running" | "completed" | "failed";
          market_regime: Json;
          universe_count: number;
          recommendation_count: number;
          error_message: string | null;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["scans"]["Row"]> & {
          scan_date: string;
          started_at?: string;
          status?: "queued" | "running" | "completed" | "failed";
        };
        Update: Partial<Database["public"]["Tables"]["scans"]["Row"]>;
      };
      strategies: {
        Row: {
          id: string;
          slug: string;
          name: string;
          type: string;
          enabled: boolean;
          risk_level: "conservative" | "balanced" | "aggressive";
          thresholds: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["strategies"]["Row"]> & {
          slug: string;
          name: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["strategies"]["Row"]>;
      };
      recommendations: {
        Row: {
          id: string;
          scan_id: string;
          symbol: string;
          company_name: string;
          strategy_type: string;
          entry: Json;
          exit_plan: Json;
          option_legs: Json;
          probability_of_profit: number;
          expected_move: number;
          max_risk: number;
          max_reward: number;
          risk_reward_ratio: number;
          confidence_score: number;
          greeks: Json;
          iv_percentile: number;
          liquidity_score: number;
          technical_score: number;
          historical_win_rate: number;
          suggested_position_size_pct: number;
          rationale: string[];
          warnings: string[];
          expires_at: string;
          status: "open" | "closed" | "expired" | "skipped";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recommendations"]["Row"]> & {
          scan_id: string;
          symbol: string;
          company_name: string;
          strategy_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Row"]>;
      };
      option_contracts: {
        Row: {
          id: string;
          symbol: string;
          underlying_symbol: string;
          expiration_date: string;
          strike: number;
          contract_type: "call" | "put";
          bid: number;
          ask: number;
          last: number | null;
          volume: number;
          open_interest: number;
          implied_volatility: number;
          delta: number | null;
          gamma: number | null;
          theta: number | null;
          vega: number | null;
          captured_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["option_contracts"]["Row"]> & {
          symbol: string;
          underlying_symbol: string;
          expiration_date: string;
          strike: number;
          contract_type: "call" | "put";
        };
        Update: Partial<Database["public"]["Tables"]["option_contracts"]["Row"]>;
      };
      trade_results: {
        Row: {
          id: string;
          recommendation_id: string;
          opened_at: string | null;
          closed_at: string | null;
          entry_price: number | null;
          exit_price: number | null;
          pnl: number | null;
          pnl_pct: number | null;
          outcome: "win" | "loss" | "breakeven" | "open";
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trade_results"]["Row"]> & {
          recommendation_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["trade_results"]["Row"]>;
      };
      backtests: {
        Row: {
          id: string;
          strategy_slug: string;
          symbol: string | null;
          start_date: string;
          end_date: string;
          metrics: Json;
          parameters: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["backtests"]["Row"]> & {
          strategy_slug: string;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["backtests"]["Row"]>;
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string | null;
          scan_id: string | null;
          recipient: string;
          subject: string;
          provider_message_id: string | null;
          status: "queued" | "sent" | "failed" | "skipped";
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["email_logs"]["Row"]> & {
          recipient: string;
          subject: string;
          status?: "queued" | "sent" | "failed" | "skipped";
        };
        Update: Partial<Database["public"]["Tables"]["email_logs"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
