const COOKIE_NAME = "policy_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Builds a signed "expiry.signature" cookie value proving the shared password was entered. */
export async function createSessionCookieValue(secret: string): Promise<string> {
  const expiry = Date.now() + THIRTY_DAYS_MS;
  const signature = await hmac(secret, String(expiry));
  return `${expiry}.${signature}`;
}

export async function isSessionValid(secret: string, cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const [expiryStr, signature] = cookieValue.split(".");
  if (!expiryStr || !signature) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = await hmac(secret, expiryStr);
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export { COOKIE_NAME };
