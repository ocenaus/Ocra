/**
 * Hand-written types mirroring `supabase/migrations`. This is a stand-in
 * for the real generated types — once a Supabase project is linked, replace
 * this file with the output of:
 *
 *   supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          tier: "free" | "pro";
          is_admin: boolean;
          telegram_chat_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          address: string;
          ens_name: string | null;
          label: string | null;
          first_seen_at: string | null;
          last_analyzed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallets"]["Row"]> & { address: string };
        Update: Partial<Database["public"]["Tables"]["wallets"]["Row"]>;
        Relationships: [];
      };
      tokens: {
        Row: {
          id: string;
          address: string;
          chain_id: number;
          name: string | null;
          symbol: string | null;
          decimals: number | null;
          logo_url: string | null;
          is_verified: boolean | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tokens"]["Row"]> & { address: string };
        Update: Partial<Database["public"]["Tables"]["tokens"]["Row"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          tx_hash: string;
          log_index: number;
          block_number: number | null;
          chain_id: number;
          from_address: string;
          to_address: string | null;
          token_id: string | null;
          value_wei: string | null;
          usd_value: number | null;
          tx_type: "transfer" | "swap" | "mint" | "burn" | "contract_call" | "unknown";
          occurred_at: string;
          raw: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          tx_hash: string;
          from_address: string;
          occurred_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Relationships: [];
      };
      wallet_activity: {
        Row: {
          id: string;
          wallet_id: string;
          transaction_id: string;
          activity_type: "large_transfer" | "whale_alert" | "dex_swap" | "token_transfer" | "contract_interaction";
          amount_usd: number | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_activity"]["Row"]> & {
          wallet_id: string;
          transaction_id: string;
          activity_type: Database["public"]["Tables"]["wallet_activity"]["Row"]["activity_type"];
          occurred_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_activity"]["Row"]>;
        Relationships: [];
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          item_type: "wallet" | "token";
          wallet_id: string | null;
          token_id: string | null;
          nickname: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["watchlists"]["Row"]> & {
          user_id: string;
          item_type: "wallet" | "token";
        };
        Update: Partial<Database["public"]["Tables"]["watchlists"]["Row"]>;
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          alert_type: "wallet_large_transfer" | "token_risk_change" | "wallet_token_interaction";
          wallet_id: string | null;
          token_id: string | null;
          threshold_usd: number | null;
          config: Json;
          channel: "app" | "telegram" | "both";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alerts"]["Row"]> & {
          user_id: string;
          alert_type: Database["public"]["Tables"]["alerts"]["Row"]["alert_type"];
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Row"]>;
        Relationships: [];
      };
      alert_events: {
        Row: {
          id: string;
          alert_id: string;
          transaction_id: string | null;
          message: string;
          payload: Json;
          delivery_channel: "app" | "telegram";
          status: "pending" | "sent" | "failed";
          delivered_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alert_events"]["Row"]> & {
          alert_id: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["alert_events"]["Row"]>;
        Relationships: [];
      };
      token_risk_scores: {
        Row: {
          id: string;
          token_id: string;
          score: number;
          risk_level: "low" | "moderate" | "high" | "critical";
          reasons: Json;
          computed_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["token_risk_scores"]["Row"]> & {
          token_id: string;
          score: number;
          risk_level: Database["public"]["Tables"]["token_risk_scores"]["Row"]["risk_level"];
        };
        Update: Partial<Database["public"]["Tables"]["token_risk_scores"]["Row"]>;
        Relationships: [];
      };
      wallet_scores: {
        Row: {
          id: string;
          wallet_id: string;
          score_type: string;
          score: number;
          metrics: Json;
          computed_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_scores"]["Row"]> & {
          wallet_id: string;
          score_type: string;
          score: number;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_scores"]["Row"]>;
        Relationships: [];
      };
      smart_money_profiles: {
        Row: {
          id: string;
          wallet_id: string;
          score: number;
          signals: Json;
          metrics: Json;
          computed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["smart_money_profiles"]["Row"]> & {
          wallet_id: string;
          score: number;
        };
        Update: Partial<Database["public"]["Tables"]["smart_money_profiles"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
