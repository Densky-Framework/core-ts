import { RoutesTree } from "../shared/RoutesTree.ts";
import { WsRouteFile } from "./WsRouteFile.ts";

export class WsRoutesTree extends RoutesTree<WsRouteFile> {
  declare _TREE: WsRoutesTree;

  getParamNames(): [string, string] {
    const ctx = this.routeFile?.handler?.ctxParam || "ctx";
    const sock = this.routeFile?.handler?.sockParam || "sock";

    return [ctx, sock];
  }

  getParams(): string {
    const [ctx, sock] = this.getParamNames();

    return `${ctx}: $Dusky$.SocketCtx, ${sock}: $Dusky$.Socket`;
  }

  getReturnType(): string {
    return "Promise<void>";
  }

  getRequestVariable(): string {
    const [ctx] = this.getParamNames();

    return `${ctx}.req`;
  }

  handleConvention(_name: string, _route: WsRoutesTree): boolean {
    return false;
  }

  override generateBodyContent(): string {
    return this.routeFile
      ? this.generateMiddlewares() + this.routeFile.handler.body
      : "";
  }
}
