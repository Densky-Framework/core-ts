import type { Promisable } from "../common.ts";
import { HTTPError } from "../http/HTTPError.ts";
import version from "../../version.ts"
import { chalk } from "../deps.ts";

export type BaseServerOptions = Parameters<typeof Deno.listen>[0] & {
  verbose?: boolean;
  watchMode?: boolean;
};

const defaultOptions: Required<BaseServerOptions> = {
  hostname: "localhost",
  transport: "tcp",
  port: 0,
  verbose: false,
  watchMode: false,
};

export abstract class BaseServer {
  protected server: Deno.Listener;
  readonly options: Readonly<Required<BaseServerOptions>>;

  constructor(options: BaseServerOptions) {
    const startTime = Date.now();
    this.server = Deno.listen(options);

    this.options = options = Object.assign<
      Required<BaseServerOptions>,
      BaseServerOptions
    >(defaultOptions, options);

    if (options.verbose) {
      console.log(chalk`
  ${chalk.cyan(chalk.bold`Densky ` + version)}  ${chalk.dim`ready in ${chalk.bold(Date.now() - startTime)} ms`}
    {green ➧} {bold URL:}   {cyan http://${options.hostname}:{bold ${options.port}}}
`,
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
    error: Error,
  ): Promisable<void> {
    request.respondWith(HTTPError.fromError(error).toResponse());
  }

  async handleConnection(conn: Deno.Conn): Promise<void> {
    for await (const request of Deno.serveHttp(conn)) {
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

  abstract handleRequest(
    request: Deno.RequestEvent,
    conn: Deno.Conn,
  ): Promisable<Response>;
}
