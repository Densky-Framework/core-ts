import { fs, pathPosix } from "../../deps.ts";
import { StaticFiles } from "../../utils/StaticFiles.ts";
import { CompileOptions } from "../index.ts";
import { StaticFileNode } from "./StaticFileNode.ts";
import { StaticFileTree } from "./StaticFileTree.ts";

export async function staticDiscover(
  options: Required<CompileOptions>,
): Promise<StaticFileTree | null> {
  if (options.staticPath === false) return null;

  const folderPath = options.staticPath;
  const staticFileTree = new StaticFileTree(folderPath);
  const staticFiles = new StaticFiles(folderPath);

  const files = fs.walk(folderPath, {
    includeDirs: false,
  });

  for await (const file of files) {
    if (!file.isFile) continue;

    const relPath = pathPosix.relative(folderPath, file.path);
    const urlPath = options.staticPrefix + "/" + relPath;
    staticFileTree.files.set(
      urlPath,
      new StaticFileNode(urlPath, file.path, staticFiles),
    );
  }

  return staticFileTree;
}
