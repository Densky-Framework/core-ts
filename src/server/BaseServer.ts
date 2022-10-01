import { Promisable } from "../common.d.ts";

export type BaseServerOptions = Parameters<typeof Deno.listen>[0] & {
  verbose?: boolean;
};

export abstract class BaseServer {
  protected server: Deno.Listener;

  constructor(readonly options: BaseServerOptions) {
    this.server = Deno.listen(options);

    if (options.verbose) {
      console.log(
        `[SERVER] Initialized at ${options.hostname || "localhost"}:${
          options.port
        }`
      );
    }
  }

  async start() {
    for await (const conn of this.server) {
      try {
        const handled = this.handleConnection(conn);
        if (typeof handled === "object") {
          handled.catch((err: Error) =>
            this.handleServerError(conn, err as Error)
          );
        }
      } catch (e) {
        this.handleServerError(conn, e as Error);
      }
    }
  }

  handleServerError(conn: Deno.Conn, _error: Error): Promisable<void> {
    conn.close();
  }

  async handleConnection(conn: Deno.Conn): Promise<void> {
    const http = Deno.serveHttp(conn);
    for await (const request of http) {
      this.handleRequest(request);
    }
  }

  abstract handleRequest(_request: Deno.RequestEvent): Promisable<void>;
}
