import { fs, pathMod } from "../../deps.ts";
import { StaticFiles } from "../../utils/StaticFiles.ts";
import { StaticFileNode } from "./StaticFileNode.ts";
import { StaticFileTree } from "./StaticFileTree.ts";

export async function staticDiscover(
  folderPath: string
): Promise<StaticFileTree> {
  const staticFileTree = new StaticFileTree(folderPath);
  const staticFiles = new StaticFiles(folderPath);

  const files = fs.walk(folderPath, {
    includeDirs: false,
  });

  for await (const file of files) {
    if (!file.isFile) continue;

    const urlPath = "/" + pathMod.relative(folderPath, file.path);
    staticFileTree.files.set(urlPath, new StaticFileNode(urlPath, staticFiles));
  }

  return staticFileTree;
}
