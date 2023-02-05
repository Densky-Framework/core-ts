// deno-lint-ignore-file
// .densky/http/convention/middleware/deep.ts
// THIS FILE WAS GENERATED BY DENSKY-BACKEND (by Apika Luca)
import * as $Densky$ from "densky";
import $middle$0 from "./_middleware.ts";
import $child$0 from "./deep/route.ts";

async function handler(
  req: $Densky$.HTTPRequest,
): Promise<$Densky$.HTTPPossibleResponse> {
  const urlMatcherPrepare_pathname = req.pathname;
  if (urlMatcherPrepare_pathname.startsWith("/convention/middleware/deep")) {
    const out$0 = await $child$0(req);
    if (out$0) return out$0;
  }
}

export default handler;
