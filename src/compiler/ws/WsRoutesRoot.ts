import { WsRouteFile } from "./WsRouteFile.ts";
import { WsRoutesTree } from "./WsRoutesTree.ts";

export class WsRoutesRoot extends WsRoutesTree {
  connectFile: WsRouteFile | null = null;
  disconectFile: WsRouteFile | null = null;

  override handleConvention(name: string, route: WsRoutesTree): boolean {
    switch (name) {
      case "connect":
        this.connectFile = route.routeFile!;
        return true;

      case "disconect":
        this.disconectFile = route.routeFile!;
        return true;

      default:
        return false;
    }
  }

  override generateBodyContent(): string {
    return "";
  }
}
