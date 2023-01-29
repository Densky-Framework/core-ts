import { CompileOptions } from "../compiler.ts";
import { fs, pathMod } from "../deps.ts";
import { DynamicHtmlTree, DynamicHtmlTreeNode } from "./DynamicHtmlTree.ts";

export async function dynamicDiscover(
  options: Required<CompileOptions>,
): Promise<DynamicHtmlTree | null> {
  if (options.viewsPath === false) return null;
  const folderPath = options.viewsPath;
  const dynamicHtmlTree = new DynamicHtmlTree(folderPath, options.outDir);

  const files = fs.walk(folderPath, {
    includeDirs: false,
  });

  for await (const file of files) {
    if (!file.isFile) continue;

    const filePath = file.path;

    const relPath = pathMod.relative(folderPath, filePath);
    // Create node without generate its render build
    const node = new DynamicHtmlTreeNode(
      filePath,
      dynamicHtmlTree.getBuildFilePath(filePath) + ".ts",
    );

    dynamicHtmlTree.tree.set(relPath, node);
  }

  return dynamicHtmlTree;
}
