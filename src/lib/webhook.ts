import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhook(
  raw: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
) {
  if (
    !timestamp ||
    !signature ||
    !/^\d{13}$/.test(timestamp) ||
    !/^sha256=[0-9a-f]{64}$/i.test(signature)
  )
    return false;
  if (Math.abs(now - Number(timestamp)) > 5 * 60_000) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${raw}`)
    .digest("hex");
  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature.slice(7), "hex"),
  );
}
