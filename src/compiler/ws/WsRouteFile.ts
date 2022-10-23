import { handleParser } from "./handleParser.ts";
import { RouteFile } from "../shared/RouteFile.ts";
import { WsRouteHandler } from "./WsRouteHandler.ts";

export class WsRouteFile extends RouteFile {
  handler!: WsRouteHandler;

  protected handleContent(content: string): void | Promise<void> {
    const handle = handleParser(content, this.filePath);

    this.handler = handle;
  }
}
