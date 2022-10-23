import { HTTPMethodStr } from "../../common.ts";

export class HttpRouteHandler {
  constructor(
    readonly method: HTTPMethodStr,
    public body: string,
    readonly reqParam?: string,
  ) {}
}
