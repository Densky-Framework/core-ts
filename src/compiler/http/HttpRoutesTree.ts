import { RoutesTree } from "../shared/RoutesTree.ts";
import { HttpRouteFile } from "./HttpRouteFile.ts";

export class HttpRoutesTree extends RoutesTree<HttpRouteFile> {
  declare _TREE: HttpRoutesTree;

  handleConvention(_name: string, _route: HttpRoutesTree): boolean {
    return false;
  }

  generateBodyContent() {
    const hasAny = this.routeFile?.handlers?.has("ANY") ?? false;
    const middlewares = this.generateMiddlewares();

    return this.routeFile
      ? Array.from(this.routeFile.handlers.entries())
        .map(([method, handl]) => {
          return method !== "ANY"
            ? `if (req.method === "${method}") {
    ${middlewares}
    ${handl.body}
  }`
            : middlewares + handl.body;
        })
        .join("\n") +
        (!hasAny && !this.isMiddleware
          ? "\n\nreturn new $Dusky$.HTTPError($Dusky$.StatusCode.NOT_METHOD).toResponse()"
          : "")
      : "";
  }
}
