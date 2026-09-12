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
          subscription_tier: "essential" | "premium" | "enterprise";
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
          subscription_tier?: "essential" | "premium" | "enterprise";
          email_digest_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: "essential" | "premium" | "enterprise";
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          stripe_checkout_session_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          trial_end: string | null;
          last_stripe_event_id: string | null;
          last_stripe_event_created_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
      subscription_coupons: {
        Row: {
          id: string;
          code: string;
          percent_off: number;
          duration: "once" | "forever";
          max_redemptions: number | null;
          expires_at: string | null;
          stripe_coupon_id: string;
          stripe_promotion_code_id: string;
          active: boolean;
          times_redeemed: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscription_coupons"]["Row"]> & {
          code: string;
          percent_off: number;
          duration: "once" | "forever";
          stripe_coupon_id: string;
          stripe_promotion_code_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_coupons"]["Row"]>;
      };
      billing_webhook_events: {
        Row: {
          id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_webhook_events"]["Row"]>;
      };
      premium_invites: {
        Row: {
          id: string;
          token_hash: string;
          token_prefix: string;
          intended_email: string | null;
          redeemed_email: string | null;
          note: string | null;
          expires_at: string;
          redeemed_at: string | null;
          redeemed_by: string | null;
          revoked_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["premium_invites"]["Row"]> & {
          token_hash: string;
          token_prefix: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["premium_invites"]["Row"]>;
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
      recommendation_expiration_outcomes: {
        Row: {
          id: string;
          recommendation_id: string;
          scan_id: string;
          symbol: string;
          company_name: string;
          strategy_type: "cash_secured_put" | "covered_call";
          universe_group: string;
          recommended_at: string;
          expiration_date: string;
          underlying_entry_price: number;
          underlying_expiration_price: number;
          strike_price: number;
          option_credit_per_share: number;
          premium_received: number;
          intrinsic_value: number;
          breakeven_price: number;
          modeled_pnl: number;
          modeled_return_pct: number;
          assignment_status: "expired_without_assignment" | "put_assigned" | "shares_called_away";
          assignment_avoided: boolean;
          probability_of_profit: number;
          confidence_score: number;
          price_source: string;
          settlement_method: string;
          evaluated_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recommendation_expiration_outcomes"]["Row"]> & {
          recommendation_id: string;
          scan_id: string;
          symbol: string;
          company_name: string;
          strategy_type: "cash_secured_put" | "covered_call";
          universe_group: string;
          recommended_at: string;
          expiration_date: string;
          underlying_entry_price: number;
          underlying_expiration_price: number;
          strike_price: number;
          option_credit_per_share: number;
          premium_received: number;
          intrinsic_value: number;
          breakeven_price: number;
          modeled_pnl: number;
          modeled_return_pct: number;
          assignment_status: "expired_without_assignment" | "put_assigned" | "shares_called_away";
          assignment_avoided: boolean;
          probability_of_profit: number;
          confidence_score: number;
          price_source: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendation_expiration_outcomes"]["Row"]>;
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
    Functions: {
      redeem_premium_invite: {
        Args: { p_token_hash: string };
        Returns: string;
      };
      sync_billing_subscription: {
        Args: {
          p_user_id: string;
          p_tier: "essential" | "premium" | "enterprise";
          p_status: string;
          p_customer_id: string;
          p_subscription_id: string;
          p_price_id: string;
          p_period_end: string | null;
          p_cancel_at_period_end: boolean;
          p_canceled_at: string | null;
          p_trial_end: string | null;
          p_event_id: string;
          p_event_created_at: string;
        };
        Returns: undefined;
      };
      get_pending_expiration_recommendations: {
        Args: { p_expiration_date: string; p_limit?: number };
        Returns: Array<{
          id: string;
          scan_id: string;
          symbol: string;
          company_name: string;
          strategy_type: string;
          entry: Json;
          option_legs: Json;
          probability_of_profit: number;
          confidence_score: number;
          created_at: string;
          expires_at: string;
        }>;
      };
    };
    Enums: Record<string, never>;
  };
};
