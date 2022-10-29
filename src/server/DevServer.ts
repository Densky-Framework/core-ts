import { StatusCode } from "../common.ts";
import { HTTPError, HTTPRequest } from "../http/index.ts";
import { IController } from "../router/Controller.ts";
import { BaseServer, BaseServerOptions } from "./BaseServer.ts";
import { toResponse } from "../utils.ts";
import { HttpRoutesTree } from "../compiler/http/HttpRoutesTree.ts";
import { httpDiscover } from "../compiler/http/discover.ts";
import { graphHttpToTerminal } from "../compiler/grapher/terminal.ts";

export class DevServer extends BaseServer {
  routesTree!: HttpRoutesTree;
  controllersCache = new Map<string, IController>();

  constructor(options: BaseServerOptions, readonly routesPath: string) {
    super(options);
  }

  override async start(): Promise<void> {
    const tmpDir = await Deno.makeTempDir({ prefix: "densky-cache" });
    const routesTree = await httpDiscover({
      routesPath: this.routesPath,
      wsPath: false,
      staticPath: false,
      staticPrefix: "/static",
      outDir: tmpDir,
      verbose: false,
    }, false);

    if (!routesTree) throw new Error("Can't generate the routes tree");
    this.routesTree = routesTree;

    console.log("Routes Tree:");
    graphHttpToTerminal(routesTree);

    await super.start();
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
        controllerMod = await import(controllerUrl);
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
