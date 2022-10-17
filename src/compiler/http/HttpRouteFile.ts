import { RouteFile } from "../shared/RouteFile.ts";
import { RouteHandler } from "../RouteHandler.ts";
import { HTTPMethodStr } from "../../common.ts";
import { handleParser } from "./handleParser.ts";

export class HttpRouteFile extends RouteFile {
  handlers = new Map<HTTPMethodStr, RouteHandler>();

  setHandler(method: HTTPMethodStr, body: RouteHandler) {
    body.body = this.resolveDynamicImports(body.body);

    this.handlers.set(method, body);

    return this;
  }

  protected handleContent(content: string): void | Promise<void> {
    const handlers = handleParser(content, this.filePath);

    for (const handler of handlers) this.setHandler(handler.method, handler);
  }
}
