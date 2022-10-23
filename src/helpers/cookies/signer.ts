import {
  Cookie,
  decode64,
  encode64,
  getCookies,
  setCookie,
} from "../../deps.ts";
import { log_warn } from "../../compiler/logger.ts";

export const cookiePasswordKey = "DENSKY_COOKIE_PASSWORD";

if (!Deno.env.get(cookiePasswordKey)) {
  log_warn(
    "Cookie password is not setted, using fallback 'not-setted'. Env key: " +
      cookiePasswordKey,
  );
}

const cookiePassword = Deno.env.get(cookiePasswordKey) || "not-setted";
const cookieKey = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(cookiePassword),
  { name: "HMAC", hash: "SHA-256" },
  true,
  ["sign", "verify"],
);

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

/** @internal */
export async function sign(data: string) {
  const d = await crypto.subtle.sign("HMAC", cookieKey, encoder.encode(data));

  return encodeURI(encode64(d));
}

/** @internal */
export async function verify(signature: string, data: string) {
  const sign_decoded = decode64(decodeURI(signature));

  return await crypto.subtle.verify(
    "HMAC",
    cookieKey,
    sign_decoded,
    encoder.encode(data),
  );
}

export async function getDecodedCookies(
  headers: Headers,
): Promise<Record<string, string>> {
  const cookies = getCookies(headers);

  for (const [key, cookie] of Object.entries(cookies)) {
    const isSigned = cookie.startsWith("s:");
    if (!isSigned) continue;

    try {
      // The signed cookie is always in base64 and
      // has the next format: VALUE.SIGNATURE
      const [value, signature] = decoder.decode(decode64(cookie.slice(2))).split(".", 1);
      const verified = await verify(signature, decodeURI(value));

      if (verified) {
        cookies[key] = value;
      } else {
        delete cookies[key];
      }
    } catch (e) {
      log_warn("Error decoding cookie (" + key + "):", e);
    }
  }

  return cookies;
}

/** @internal */
export async function signedCookie(data: string) {
  const signature = await sign(data);

  return encode64(`${encodeURI(data)}.${signature}`);
}

export type CookieOptions = Omit<Cookie, "name" | "value"> & {
  raw?: boolean;
};

export async function setEncodedCookie(
  headers: Headers,
  key: string,
  value: string,
  options: CookieOptions,
): Promise<void> {
  const cookieValue = options.raw ? value : await signedCookie(value);

  const cookie: Cookie = {
    name: key,
    value: cookieValue,
    ...options,
  };

  setCookie(headers, cookie);
}
