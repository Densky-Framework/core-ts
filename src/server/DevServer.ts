import { StatusCode } from "../common.ts";
import { path, pathPosix } from "../deps.ts";
import { HTTPError, HTTPRequest } from "../http/index.ts";
import { IController } from "../router/Controller.ts";
import { BaseServer, BaseServerOptions } from "./BaseServer.ts";
import { toResponse } from "../utils.ts";

export class DevServer extends BaseServer {
  constructor(options: BaseServerOptions, readonly routesPath: string) {
    super(options);
    routesPath = new URL(routesPath).pathname;
  }

  protected resolveRawRoute(route: string): string {
    route = route.trim();

    if (pathPosix.isAbsolute(route)) {
      route = route.slice(1).trim();
    }

    if (route === "") {
      route = "index";
    }

    return path.join(this.routesPath, route);
  }

  protected async resolveRoute(route: string): Promise<string | null> {
    const rawRoute = this.resolveRawRoute(route);

    const handleFile = async (filePath: string) => {
      // If can open it and it's a file, then return the file path,
      // else return null
      try {
        return (await (await Deno.open(filePath)).stat()).isFile
          ? filePath
          : null;
      } catch (_) {
        return null;
      }
    };

    return (
      // Handle ROUTE.ts
      (await handleFile(rawRoute + ".ts")) ??
      // Handle ROUTE/index.ts
      (await handleFile(pathPosix.join(rawRoute, "index.ts"))) ??
      // Handle ROUTE/_fallback.ts
      (await handleFile(pathPosix.join(rawRoute, "_fallback.ts"))) ??
      // Handle _fallback.ts
      (await handleFile(
        pathPosix.join(pathPosix.dirname(rawRoute), "_fallback.ts")
      ))
    );
  }

  async handleRequest(request: Deno.RequestEvent): Promise<Response> {
    const url = new URL(request.request.url);
    const controllerUrl = await this.resolveRoute(url.pathname);

    // There isn't a controller for given path
    if (!controllerUrl) {
      return new HTTPError(StatusCode.NOT_FOUND)
        .withDetails({ code: "ENOTFOUND" })
        .toResponse();
    }

    // Try to import and handle import errors
    let controllerMod;

    try {
      controllerMod = await import(controllerUrl);
    } catch (e) {
      return HTTPError.fromError(e as Error).toResponse();
    }

    if (typeof controllerMod["default"] !== "function") {
      return new HTTPError(
        StatusCode.INTERNAL_ERR,
        "Not default export or it isn't a class"
      )
        .withName("ExportError")
        .toResponse();
    }

    const controller: IController = new controllerMod["default"]();
    const method = request.request.method as keyof IController;

    if (method in controller && typeof controller[method] === "function") {
      try {
        const response = await controller[method]!(new HTTPRequest(request));
        return toResponse(response);
      } catch (e) {
        return HTTPError.fromError(e as Error).toResponse();
      }
    }

    if ("ANY" in controller) {
      return new Response("Teapot ANY");
    }

    return new HTTPError(StatusCode.NOT_METHOD).toResponse();
  }
}
