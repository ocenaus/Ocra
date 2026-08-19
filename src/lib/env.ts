import { z } from "zod";

/**
 * Centralized, validated environment access.
 *
 * `clientEnv` only contains NEXT_PUBLIC_* values and is safe to import
 * from client components. `serverEnv` contains secrets and must only be
 * imported from server-only code (API routes, server components, services).
 * Importing "server-only" here makes an accidental client import fail the
 * build instead of leaking a secret into the browser bundle.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default("http://localhost:3000"),
});

const clientParsed = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!clientParsed.success) {
  console.warn(
    "[env] Missing/invalid public environment variables:",
    clientParsed.error.flatten().fieldErrors,
  );
}

export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

/** Server-only secrets. Never import this module from a client component. */
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ?? "",
  MORALIS_API_KEY: process.env.MORALIS_API_KEY ?? "",
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY ?? "",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
  OCS_CONTRACT_ADDRESS: process.env.OCS_CONTRACT_ADDRESS ?? "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};

/** Which optional data providers are actually configured right now. */
export function getProviderStatus() {
  return {
    supabase: Boolean(clientEnv.NEXT_PUBLIC_SUPABASE_URL && clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    alchemy: Boolean(serverEnv.ALCHEMY_API_KEY),
    moralis: Boolean(serverEnv.MORALIS_API_KEY),
    etherscan: Boolean(serverEnv.ETHERSCAN_API_KEY),
    telegram: Boolean(serverEnv.TELEGRAM_BOT_TOKEN),
  };
}
