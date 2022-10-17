import { HTTPMethodStr } from "../common.ts";

export class RouteHandler {
  constructor(
    readonly method: HTTPMethodStr,
    public body: string,
    readonly reqParam?: string,
  ) {}
}
