import { HTTPMethodStr } from "../common.ts";

export class HTTPRequest {
  readonly raw: Request;
  readonly method: HTTPMethodStr;
  readonly pathname: 

  constructor(readonly event: Deno.RequestEvent) {
    this.raw = event.request;
    this.method = this.raw.method as HTTPMethodStr;
  }
}
