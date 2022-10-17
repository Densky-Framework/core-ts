import { RoutesTree } from "../shared/RoutesTree.ts";

export class HttpRoutesTree extends RoutesTree {
  handleConvention(_name: string, _route: HttpRoutesTree): boolean {
    return false;
  }
}
