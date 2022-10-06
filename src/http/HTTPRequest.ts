import { HTTPMethodStr } from "../common.ts";

export class HTTPRequest {
  readonly raw: Request;
  readonly method: HTTPMethodStr;
  readonly url: URL;
  readonly pathname: string;

  constructor(readonly event: Deno.RequestEvent) {
    this.raw = event.request;
    this.method = this.raw.method as HTTPMethodStr;
    this.url = new URL(this.raw.url);
    this.pathname = this.url.pathname;
  }
}
