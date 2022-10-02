import { isAbsolute, join } from "https://deno.land/std@0.158.0/path/posix.ts";
import type { Promisable } from "../common.ts";
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

    options.routesPath = new URL(options.routesPath).pathname;

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

  protected resolveRawRoute(route: string): string {
    route = route.trim();

    if (isAbsolute(route)) {
      route = route.slice(1).trim();
    }

    if (route === "") {
      route = "index";
    }

    return join(this.options.routesPath, route);
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
        const handled = this.handleRequest(request, conn);

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

  abstract handleRequest(request: Deno.RequestEvent, conn: Deno.Conn): Promisable<Response>;
}
