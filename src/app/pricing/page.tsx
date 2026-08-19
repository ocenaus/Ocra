import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Pricing",
  description: "ORCA Free and Pro plans.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with the essentials.",
    features: [
      "Limited scans per day",
      "Basic wallet scanner",
      "Basic token scanner",
      "Basic ORCA Risk Score",
    ],
    cta: "Get started",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "Coming soon",
    description: "Full ORCA intelligence, unlimited.",
    features: [
      "Unlimited scans",
      "Advanced wallet intelligence",
      "Advanced risk analysis",
      "Whale tracking",
      "Smart Money analytics",
      "Alerts",
      "Telegram alerts",
    ],
    cta: "Billing coming soon",
    href: null,
    featured: true,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Pricing</h1>
        <p className="mt-2 text-muted-foreground">Start free. Upgrade when you need the full depth of ORCA.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={plan.featured ? "border-primary/50" : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {plan.featured && <Badge>Most capability</Badge>}
              </div>
              <p className="text-2xl font-semibold text-foreground">{plan.price}</p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.featured ? "default" : "outline"} disabled={!plan.href} asChild={Boolean(plan.href)}>
                {plan.href ? <a href={plan.href}>{plan.cta}</a> : <span>{plan.cta}</span>}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Payment processing is not yet enabled. Pro billing (Stripe) will be added in a later phase — no charges
        are or will be made until then.
      </p>
    </div>
  );
}
