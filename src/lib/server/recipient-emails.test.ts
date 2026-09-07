import { describe, it, expect, vi } from "vitest";
import { resolveRecipientEmails } from "./recipient-emails";

describe("resolveRecipientEmails", () => {
  it("returns an empty map without calling the RPC when given no IDs", async () => {
    const rpc = vi.fn();
    const result = await resolveRecipientEmails({ rpc } as any, []);
    expect(result).toEqual({});
    expect(rpc).not.toHaveBeenCalled();
  });

  it("dedupes IDs before calling the RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ id: "u1", email: "a@example.com" }], error: null });
    await resolveRecipientEmails({ rpc } as any, ["u1", "u1", "u1"]);
    expect(rpc).toHaveBeenCalledWith("get_recipient_emails", { p_user_ids: ["u1"] });
  });

  it("builds an id -> email map from the RPC result", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        { id: "u1", email: "a@example.com" },
        { id: "u2", email: "b@example.com" },
      ],
      error: null,
    });

    const result = await resolveRecipientEmails({ rpc } as any, ["u1", "u2"]);
    expect(result).toEqual({ u1: "a@example.com", u2: "b@example.com" });
  });

  it("omits an ID from the map when auth.users has no email for it (never a fabricated empty string)", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "u1", email: null }],
      error: null,
    });

    const result = await resolveRecipientEmails({ rpc } as any, ["u1"]);
    expect(result).toEqual({});
    expect("u1" in result).toBe(false);
  });

  it("throws when the RPC call errors, rather than silently returning an empty map", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "permission denied" } });
    await expect(resolveRecipientEmails({ rpc } as any, ["u1"])).rejects.toThrow(/permission denied/);
  });
});
