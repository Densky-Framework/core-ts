import { StatusCode } from "../common.ts";
import { HTTPError, HTTPRequest, HTTPResponse } from "../http/index.ts";
import { IController } from "../router/Controller.ts";
import { BaseServer, BaseServerOptions } from "./BaseServer.ts";
import { StaticFiles, toResponse } from "../utils.ts";
import { HttpRoutesTree } from "../compiler/http/HttpRoutesTree.ts";
import { httpDiscover } from "../compiler/http/discover.ts";
import { StaticFileTree } from "../compiler/static/StaticFileTree.ts";
import { staticDiscover } from "../compiler/static/discover.ts";
import { graphHttpToTerminal } from "../compiler/grapher/terminal.ts";
import { CompileOptions } from "../compiler/types.ts";
import { Watcher } from "../utils/Watcher/Watcher.ts";
import { chalk, fs, pathMod } from "../deps.ts";
import { Globals } from "../globals.ts";
import { WatchEvent } from "../utils/Watcher/WatchEvent.ts";

export type DevServerOptions = Omit<CompileOptions, "outDir" | "verbose">;

export class DevServer extends BaseServer {
  routesTree!: HttpRoutesTree;
  staticTree: StaticFileTree | null = null;
  controllersCache = new Map<string, IController>();

  constructor(
    options: BaseServerOptions,
    readonly devOptions: DevServerOptions,
  ) {
    super(options);
  }

  override async start(): Promise<void> {
    const tmpDir = await Deno.makeTempDir({ prefix: "densky-cache" });
    const opts: Required<CompileOptions> = {
      wsPath: false,
      staticPath: false,
      staticPrefix: "/static",
      viewsPath: false,
      ...this.devOptions,
      outDir: tmpDir,
      verbose: false,
    };

    const routesTree = await httpDiscover(opts, false);

    if (!routesTree) throw new Error("Can't generate the routes tree");
    this.routesTree = routesTree;
    this.#setupWatchers(opts);

    const staticTree = await staticDiscover(opts);

    if (staticTree) {
      this.staticTree = staticTree;
    }

    if (opts.viewsPath) {
      HTTPResponse.viewsTree = new StaticFiles(opts.viewsPath);
    }

    console.log("Routes Tree:");
    graphHttpToTerminal(routesTree);

    await super.start();
  }

  async #setupWatcher(
    name: string,
    path: string,
    exec: (event: WatchEvent) => unknown,
  ) {
    Watcher.setupRoot(name, path);

    const globalPath = pathMod.resolve(Globals.cwd, path);

    for await (
      const file of fs.walk(globalPath, {
        includeDirs: false,
      })
    ) {
      WatchEvent.trackingFiles.add(file.path);
    }

    Watcher.watch(name + "/")(async (ev) => {
      // Just access to 'create' and 'remove' kinds
      // for re-discover
      if (ev.kind === "modify") return;

      // Execute
      console.clear();
      await exec(ev);
      console.log(
        chalk`{cyan  {bold  DENSKY} ${name.toUpperCase()} {green ${ev.kind}} ${
          pathMod.relative(globalPath, ev.path)
        }}`,
      );

    });
  }

  #setupWatchers(opts: Required<CompileOptions>) {
    Watcher.enabled = true;

    // Routes
    this.#setupWatcher("routes", opts.routesPath, async () => {
      const routesTree = await httpDiscover(opts, false);
      if (!routesTree) throw new Error("Can't generate the routes tree");
      this.routesTree = routesTree;

      graphHttpToTerminal(this.routesTree);
    });

    // Static
    if (opts.staticPath) {
      this.#setupWatcher("static", opts.staticPath, async () => {
        const staticTree = await staticDiscover(opts);
        if (!staticTree) throw new Error("Can't generate the static tree");
        this.staticTree = staticTree;
      });
    }

    // Views
    if (opts.viewsPath) {
      this.#setupWatcher("views", opts.viewsPath, () => {
        HTTPResponse.viewsTree = new StaticFiles(opts.viewsPath as string);
      });
    }
  }

  async runMethod(
    controller: IController,
    method: keyof IController,
    httpRequest: HTTPRequest,
  ): Promise<Response | null> {
    try {
      const response = await controller[method]!(httpRequest);
      if (response) {
        return toResponse(httpRequest, response);
      } else return null;
    } catch (e) {
      return HTTPError.fromError(e as Error).toResponse();
    }
  }

  /**
   * Resolve controllers and use cache
   */
  protected async getController(
    controllerTree: HttpRoutesTree | null,
  ): Promise<IController | Response> {
    const controllerUrl = controllerTree && controllerTree.routeFile?.filePath;

    // There isn't a controller for given path
    if (!controllerUrl) {
      return new HTTPError(StatusCode.NOT_FOUND).toResponse();
    }

    // Try to import and handle import errors
    let controllerMod;

    try {
      if (this.controllersCache.has(controllerUrl)) {
        controllerMod = this.controllersCache.get(controllerUrl);
      } else {
        // If it isn't cached, then recalculate middlewares for
        // prevent bugs in discover
        controllerTree.calculateMiddlewares();
        console.log("[DevServer] Loading controller at " + controllerUrl);
        controllerMod = await import("file://" + controllerUrl);

        // Watch controller
        const globalRoutesPath = pathMod.resolve(Globals.cwd, this.devOptions.routesPath);
        const relPath = pathMod.relative(globalRoutesPath, controllerUrl)

        // TODO: When editing dispatch 'create', 'access', and 'modify' events, 
        // try to fix it
        console.log("watching ", relPath)
        const watcher = Watcher.watch("routes/" + relPath);
        const callback = (event: Deno.FsEvent) => {
          console.log(event);
        }

        watcher(callback);
      }
    } catch (e) {
      return HTTPError.fromError(e as Error).toResponse();
    }

    if (typeof controllerMod["default"] !== "function") {
      return new HTTPError(
        StatusCode.INTERNAL_ERR,
        "Not default export or it isn't a class",
      )
        .withName("ExportError")
        .withDetails({ note: "This file will be ignored at build time" })
        .toResponse();
    }

    this.controllersCache.set(controllerUrl, controllerMod);

    const controller: IController = new controllerMod["default"]();

    return controller;
  }

  /**
   * MainHandler
   *
   * Get raw event, resolve controllers and middlewares, and run methods
   */
  async handleRequest(request: Deno.RequestEvent): Promise<Response> {
    const httpRequest = new HTTPRequest(request);

    // Static Files Handler
    StaticFilesHandler: {
      if (!this.staticTree) break StaticFilesHandler;

      const res = await this.staticTree.handleRequest(httpRequest.pathname);
      if (res) return res;
    }

    // Api Routes Handler
    const controllerTree = this.routesTree.handleRoute(
      httpRequest.pathname,
      httpRequest.params,
    );
    let controller: IController;

    {
      const _ = await this.getController(controllerTree);

      if (_ instanceof Response) return _;

      controller = _;
    }

    const method = httpRequest.method as keyof IController;

    const runMethod = async (method: keyof IController): Promise<Response> => {
      await httpRequest.prepare();
      const middlewares = controllerTree!.middlewares;

      for (const middlewareTree of middlewares) {
        // Get middleware controller
        let middleware: IController;
        {
          const _ = await this.getController(middlewareTree);
          if (_ instanceof Response) return _;
          middleware = _;
        }

        // Run and if return something, then it will be the response
        const res = await this.runMethod(middleware, method, httpRequest);

        if (res) return res;
      }

      return (await this.runMethod(controller, method, httpRequest))!;
    };

    if (method in controller && typeof controller[method] === "function") {
      return await runMethod(method);
    }

    if ("ANY" in controller && typeof controller.ANY === "function") {
      return await runMethod("ANY");
    }

    return new HTTPError(StatusCode.NOT_METHOD).toResponse();
  }
}
