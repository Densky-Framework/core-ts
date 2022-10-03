import { Promisable } from "../common.ts";
import { BaseServer, BaseServerOptions } from "./BaseServer.ts";

type RequestHandler = (
  request: Deno.RequestEvent,
  conn: Deno.Conn
) => Promisable<Response>;

export class Server extends BaseServer {
  constructor(
    options: BaseServerOptions,
    readonly requestHandler: RequestHandler
  ) {
    super(options);
  }

  async handleRequest(req: Deno.RequestEvent, conn: Deno.Conn) {
    return await this.requestHandler(req, conn);
  }
}
