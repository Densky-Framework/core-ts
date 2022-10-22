import { fs, path as pathMod } from "../../deps.ts";
import { HttpRouteFile } from "./HttpRouteFile.ts";
import { HttpRoutesTree } from "./HttpRoutesTree.ts";
import {
  log_error,
  log_warn,
  makeLog_info,
  makeLog_success_v,
} from "../logger.ts";
import { CompileOptions } from "../types.ts";

/**
 * Discover all routes and return their tree
 */
export async function httpDiscover(
  opts: Required<CompileOptions>,
): Promise<HttpRoutesTree | null> {
  const log_info = makeLog_info(opts.verbose);
  const log_success_v = makeLog_success_v(opts.verbose);
  const outDir = pathMod.join(opts.outDir, "http");

  log_info("Scanning http files");
  const files = new Map<string, HttpRouteFile>();

  const glob = fs.expandGlob("**/*.ts", {
    root: opts.routesPath,
    globstar: true,
  });

  for await (const file of glob) {
    if (!file.isFile) return null;

    const relPath = pathMod.relative(opts.routesPath, file.path);

    if (files.has(relPath)) {
      log_error(`Strange file overlapping with ${file.path}`);
      return null;
    }

    const routeFile = new HttpRouteFile(
      file.path,
      pathMod.join(outDir, relPath),
    );

    try {
      routeFile.setFileContent(await Deno.readTextFile(file.path));
    } catch (e) {
      log_warn("(Ignored) " + (e as Error).message);
      continue;
    }

    files.set(relPath.slice(0, -3), routeFile);
  }

  log_success_v("Files count:", files.size);

  const fileRoutesTree = new HttpRoutesTree(
    "/",
    pathMod.join(outDir, "index.ts"),
    null,
    true,
  );
  const fileTrees = new Map<string, HttpRoutesTree>();

  const fileEntries = Array.from(files.entries()).sort(([a], [b]) =>
    a.endsWith("_index")
      ? -1
      : b.endsWith("_index")
      ? 1
      : a.endsWith("]")
      ? 1
      : b.endsWith("]")
      ? -1
      : a.split("/").length - b.split("/").length
  );

  const putFileRecursive = (path: string, tree: HttpRoutesTree) => {
    const fatherRoute = pathMod.dirname(path);
    const fatherRouteTree = fileTrees.get(fatherRoute);

    if (fatherRouteTree) {
      fatherRouteTree.addChild(tree);
    } else {
      // Create father and try to put it on tree
      const fatherRouteTree = new HttpRoutesTree(
        fatherRoute,
        pathMod.join(outDir, fatherRoute + ".ts"),
        null,
      );
      fatherRouteTree.addChild(tree);
      fileTrees.set(fatherRoute, fatherRouteTree);
      putFileRecursive(fatherRoute, fatherRouteTree);
    }

    fileTrees.set(path, tree);
  };

  fileTrees.set("/", fileRoutesTree);

  // Build tree with all entries
  for (let [path, file] of fileEntries) {
    // _index is the root
    if (path === "_index") {
      fileRoutesTree.routeFile = file;
      continue;
    }

    // _index convention
    if (path.endsWith("_index")) {
      path = pathMod.dirname(path);
    }

    const currentRouteTree = new HttpRoutesTree(path, file.outPath, file);
    putFileRecursive("/" + path, currentRouteTree);
  }

  return fileRoutesTree;
}
