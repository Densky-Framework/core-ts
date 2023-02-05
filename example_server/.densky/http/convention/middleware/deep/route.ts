// deno-lint-ignore-file
// .densky/http/convention/middleware/deep/route.ts
// THIS FILE WAS GENERATED BY DENSKY-BACKEND (by Apika Luca)
import * as $Densky$ from "densky";

import $middle$0 from "./../_middleware.ts";

async function handler(
  req: $Densky$.HTTPRequest,
): Promise<$Densky$.HTTPPossibleResponse> {
  const urlMatcherPrepare_pathname = req.pathname;

  if (urlMatcherPrepare_pathname === "/convention/middleware/deep/route") {
    if (urlMatcherPrepare_pathname === "/convention/middleware/deep/route") {
      if (req.method === "GET") {
        await req.prepare();
        const $mid$0 = await $middle$0(req);
        if ($mid$0) return $mid$0;
        return new Response("ROUTE: Matched " + req.pathname);
      }

      return new $Densky$.HTTPError($Densky$.StatusCode.NOT_METHOD)
        .toResponse();
    }
  }
}

export default handler;
