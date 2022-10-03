
import { createStreaming } from "https://deno.land/x/dprint@0.2.0/mod.ts";
import { RouteFile } from "./RouteFile.ts";

// Setup Formatter
const tsFormatter = await createStreaming(
  fetch("https://plugins.dprint.dev/typescript-0.74.0.wasm")
);
tsFormatter.setConfig({ indentWidth: 2, lineWidth: 80 }, { semiColons: "asi" });

export class RoutesTree {
  children = new Set<RoutesTree>();

  constructor(readonly path: string, readonly routeFile: RouteFile | null) {}

  addChild(route: RoutesTree) {
    this.children.add(route);

    return this;
  }
}
