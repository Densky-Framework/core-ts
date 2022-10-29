import { RoutesTree } from "../shared/RoutesTree.ts";
import { HttpRouteFile } from "./HttpRouteFile.ts";

export class HttpRoutesTree extends RoutesTree<HttpRouteFile> {
  declare _TREE: HttpRoutesTree;

  handleConvention(_name: string, _route: HttpRoutesTree): boolean {
    return false;
  }

  override getParams(): string {
    return "req: $Densky$.HTTPRequest";
  }
  override getReturnType(): string {
    return "Promise<$Densky$.HTTPPossibleResponse>";
  }
  override getRequestVariable(): string {
    return "req";
  }

  generateBodyContent() {
    const hasAny = this.routeFile?.handlers?.has("ANY") ?? false;
    const prepareRequest = this.generatePrepareRequest();
    const middlewares = this.generateMiddlewares();

    return this.routeFile
      ? Array.from(this.routeFile.handlers.entries())
        .map(([method, handl]) => {
          return method !== "ANY"
            ? `if (req.method === "${method}") {
    ${prepareRequest}
    ${middlewares}
    ${handl.body}
  }`
            : prepareRequest + middlewares + handl.body;
        })
        .join("\n") +
        (!hasAny && !this.isMiddleware
          ? "\n\nreturn new $Densky$.HTTPError($Densky$.StatusCode.NOT_METHOD).toResponse()"
          : "")
      : "";
  }
}
