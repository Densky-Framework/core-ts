import { PrimitiveObject, StatusCode } from "../common.ts";

export class HTTPResponse {
  constructor(readonly event: Deno.RequestEvent) {}

  static fromJSON(obj: PrimitiveObject, init?: ResponseInit): Response {
    return new Response(JSON.stringify(obj), {
      status: StatusCode.OK,
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }
}
