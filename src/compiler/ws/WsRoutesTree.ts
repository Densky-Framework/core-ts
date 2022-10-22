import { RoutesTree } from "../shared/RoutesTree.ts";
import { WsRouteFile } from "./WsRouteFile.ts";

export class WsRoutesTree extends RoutesTree<WsRouteFile> {
  declare _TREE: WsRoutesTree;

  handleConvention(_name: string, _route: WsRoutesTree): boolean {
    return false;
  }

  override generateBodyContent(): string {
    return "";
  }
}
