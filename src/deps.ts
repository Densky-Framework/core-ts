export * as fs from "https://deno.land/std@0.158.0/fs/mod.ts";
export * as path from "https://deno.land/std@0.158.0/path/mod.ts";
// This is because 'path' is very much used in var names
export * as pathMod from "https://deno.land/std@0.158.0/path/mod.ts";
export * as pathPosix from "https://deno.land/std@0.158.0/path/posix.ts";

export {
  deleteCookie,
  getCookies,
  setCookie,
} from "https://deno.land/std@0.160.0/http/cookie.ts";
export type { Cookie } from "https://deno.land/std@0.160.0/http/cookie.ts";

export { Buffer } from "https://deno.land/std@0.158.0/io/buffer.ts";
export {
  decode as decode64,
  encode as encode64,
} from "https://deno.land/std@0.160.0/encoding/base64.ts";

export { debounce } from "https://deno.land/std@0.175.0/async/debounce.ts";

export * from "./chalk.ts";
