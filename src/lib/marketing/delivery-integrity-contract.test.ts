import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase/migrations/20261023125425_harden_marketing_dispatch_delivery.sql"),
  "utf8"
);
const dispatchRoute = readFileSync(
  join(root, "src/app/api/admin/marketing/campaigns/[id]/dispatch/route.ts"),
  "utf8"
);
const adminPage = readFileSync(
  join(root, "src/app/admin/marketing/[id]/page.tsx"),
  "utf8"
);
const reconcileRoute = readFileSync(
  join(root, "src/app/api/admin/marketing/campaigns/[id]/dispatches/[dispatchId]/reconcile/route.ts"),
  "utf8"
);

describe("marketing delivery integrity contract", () => {
  it("binds every finalization to the worker's current claim token", () => {
    expect(migration).toContain("claim_token UUID");
    expect(migration).toContain("AND dispatch.claim_token = p_claim_token");
    expect(migration).toContain("status = 'claimed'");
  });

  it("reclaims retryable email work but quarantines expired WhatsApp claims", () => {
    expect(migration).toContain("status IN ('pending', 'retryable')");
    expect(migration).toContain("p_channel = 'email'");
    expect(migration).toContain("SET status = 'outcome_unknown'");
    expect(migration).toContain("claim_expired_after_provider_attempt");
    expect(migration).toContain("provider_idempotency_expires_at");
    expect(migration).toContain("provider_idempotency_window_expired");
    expect(migration).toContain("INTERVAL '23 hours'");
  });

  it("keeps uncertain outcomes open until explicit provider reconciliation", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.reconcile_marketing_dispatch");
    expect(migration).toContain("p_resolution NOT IN ('confirmed_sent', 'confirmed_not_sent')");
    expect(adminPage).toContain("Provider reconciliation required");
    expect(adminPage).toContain("These delivery attempts may already have been accepted");
    expect(adminPage).not.toContain("These WhatsApp attempts may already have been accepted");
    expect(adminPage).toContain("they will never retry automatically");
  });

  it("fails reconciliation closed when the delivery ledger cannot be read", () => {
    expect(reconcileRoute).toContain("dispatchReadError");
    expect(reconcileRoute).toContain("MARKETING_RECONCILIATION_LOOKUP_FAILED");
    expect(reconcileRoute).toContain("Nothing was changed.");
    expect(reconcileRoute).toContain('status: 503');
  });

  it("approves the campaign and every reviewed variant in one RPC transaction", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.approve_marketing_campaign");
    expect(migration).toContain("FOR UPDATE;");
    expect(migration).toContain("variant content changed during approval");
  });

  it("requires a concrete variant id and never returns a raw caught error", () => {
    expect(dispatchRoute).toContain('const variantId = typeof body.variant_id === "string"');
    expect(dispatchRoute).toContain('.eq("id", variantId)');
    expect(dispatchRoute).toContain('code: "MARKETING_DISPATCH_FAILED"');
    expect(dispatchRoute).not.toContain("err.message");
  });
});
