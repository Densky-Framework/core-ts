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
      wsPath: "",
      outDir: tmpDir,
      verbose: false,
    }, false);

    if (!routesTree) throw new Error("Can't generate the routes tree");
    this.routesTree = routesTree;

    console.log("Routes Tree:");
    graphHttpToTerminal(routesTree);

    await super.start();
  }

  async handleRequest(request: Deno.RequestEvent): Promise<Response> {
    const httpRequest = new HTTPRequest(request);
    const controllerTree = this.routesTree.handleRoute(httpRequest.pathname);
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
    const method = httpRequest.method as keyof IController;

    const runMethod = async (method: keyof IController) => {
      try {
        const response = await controller[method]!(httpRequest);
        return toResponse(response);
      } catch (e) {
        return HTTPError.fromError(e as Error).toResponse();
      }
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
