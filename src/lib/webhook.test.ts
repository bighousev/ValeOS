import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhook } from "./webhook";
import { webhookLeadSchema } from "./validation";

describe("lead webhook", () => {
  const secret = "test-secret";
  const raw = JSON.stringify({
    source: "site",
    external_event_id: "event-1",
    name: "Maria",
    email: "maria@example.com",
  });
  const timestamp = "1791982800000";
  const signature = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
  it("accepts a signed request in the replay window", () => {
    expect(
      verifyWebhook(
        raw,
        timestamp,
        signature,
        secret,
        Number(timestamp) + 1000,
      ),
    ).toBe(true);
  });
  it("rejects replay and tampered payloads", () => {
    expect(
      verifyWebhook(
        raw,
        timestamp,
        signature,
        secret,
        Number(timestamp) + 360_000,
      ),
    ).toBe(false);
    expect(
      verifyWebhook(raw + " ", timestamp, signature, secret, Number(timestamp)),
    ).toBe(false);
  });
  it("requires a contact channel and source event id", () => {
    expect(
      webhookLeadSchema.safeParse({
        source: "site",
        external_event_id: "x",
        name: "Maria",
      }).success,
    ).toBe(false);
    expect(webhookLeadSchema.safeParse(JSON.parse(raw)).success).toBe(true);
  });
});
