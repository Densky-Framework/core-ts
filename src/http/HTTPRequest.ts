import { HTTPMethodStr } from "../common.ts";
import {Cookies} from "../helpers/cookies.ts"

export class HTTPRequest {
  readonly raw: Request;
  readonly method: HTTPMethodStr;
  readonly headers: Headers;
  readonly cookies: Cookies;

  readonly url: URL;
  readonly pathname: string;

  /** @internal */
  readonly byParts: string[];

  private _prepared = false;

  constructor(readonly event: Deno.RequestEvent) {
    this.raw = event.request;
    this.method = this.raw.method as HTTPMethodStr;
    this.headers = this.raw.headers;
    this.cookies = new Cookies(this.headers);

    this.url = new URL(this.raw.url);
    this.pathname = this.url.pathname;

    // By Parts
    {
      const targetParts = this.pathname.split("/");
      targetParts.shift();
      // Remove last if it's empty, handle "/my/path/"
      last_empty: {
        const last = targetParts.pop();
        if (last === undefined || last.length === 0) break last_empty;

        targetParts.push(last);
      }

      this.byParts = targetParts;
    }
  }

  async prepare() {
    if (this._prepared) return;

    await this.cookies.parse();
    this._prepared = true;
  }
}
