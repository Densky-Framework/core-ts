import type { Promisable } from "../common.d.ts";
import { HTTPError } from "../http/HTTPError.ts";

export type BaseServerOptions = Parameters<typeof Deno.listen>[0] & {
  verbose?: boolean;
  routesPath: string;
  watchMode?: boolean;
};

const defaultOptions: Required<BaseServerOptions> = {
  hostname: "localhost",
  transport: "tcp",
  port: 0,
  verbose: false,
  watchMode: false,
  routesPath: "",
};

export abstract class BaseServer {
  protected server: Deno.Listener;
  readonly options: Readonly<Required<BaseServerOptions>>;

  constructor(options: BaseServerOptions) {
    this.server = Deno.listen(options);

    this.options = options = Object.assign<
      Required<BaseServerOptions>,
      BaseServerOptions
    >(defaultOptions, options);

    if (options.verbose) {
      console.log(
        `[SERVER] Initialized at ${options.hostname}:${options.port}`
      );
    }
  }

  async start() {
    for await (const conn of this.server) {
      this.handleConnection(conn).catch((_) => conn.close());
    }
  }

  handleServerError(
    request: Deno.RequestEvent,
    error: Error
  ): Promisable<void> {
    request.respondWith(HTTPError.fromError(error).toResponse());
  }

  async handleConnection(conn: Deno.Conn): Promise<void> {
    const http = Deno.serveHttp(conn);
    for await (const request of http) {
      try {
        const handled = this.handleRequest(request);

        // Handle Async
        if (typeof handled === "object" && "catch" in handled) {
          handled
            .then((res: Response) => request.respondWith(res))
            .catch((err: Error) =>
              this.handleServerError(request, err as Error)
            );

          continue;
        }

        // Handle Sync
        request.respondWith(handled);
      } catch (e) {
        this.handleServerError(request, e as Error);
      }
    }
  }

  abstract handleRequest(_request: Deno.RequestEvent): Promisable<Response>;
}
