// deno-lint-ignore-file
// .densky/http/convention/middleware/_index.ts
// THIS FILE WAS GENERATED BY DENSKY-BACKEND (by Apika Luca)
import * as $Densky$ from "densky";
import $middle$0 from "./_middleware.ts";
import $child$1 from "./deep.ts";
import $child$0 from "./route.ts";

async function handler(
  req: $Densky$.HTTPRequest,
): Promise<$Densky$.HTTPPossibleResponse> {
  const urlMatcherPrepare_pathname = req.pathname;
  if (urlMatcherPrepare_pathname.startsWith("/convention/middleware")) {
    const out$0 = await $child$0(req);
    if (out$0) return out$0;
    const out$1 = await $child$1(req);
    if (out$1) return out$1;

    if (urlMatcherPrepare_pathname === "/convention/middleware") {
      if (urlMatcherPrepare_pathname === "/convention/middleware") {
        if (req.method === "GET") {
          await req.prepare();
          const $mid$0 = await $middle$0(req);
          if ($mid$0) return $mid$0;
          return new Response(
            "INDEX: Matched " + req.pathname
              + "\nYou can use ?mid in the url for test middleware",
          );
        }

        return new $Densky$.HTTPError($Densky$.StatusCode.NOT_METHOD)
          .toResponse();
      }
    }
  }
}

export default handler;
