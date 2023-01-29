import { CompileOptions } from "../compiler/types.ts";
import { pathMod } from "../deps.ts";
import { Globals } from "../globals.ts";
import { DynamicHtmlTree } from "./DynamicHtmlTree.ts";

export async function dynamicWrite(
  tree: DynamicHtmlTree,
  options: Required<CompileOptions>,
): Promise<string> {
  if (!options.viewsPath) return "";

  let nodesList = "";
  const promises: Promise<void>[] = [];

  for (const nodeKey of tree.tree.keys()) {
    const node = tree.tree.get(nodeKey)!;
    promises.push(
      node.prepare().then(() => {
        // Remove last extension (.html.ts.ts)
        const _outPath = node.outPath.split(".");
        _outPath.pop();
        const outPath = _outPath.join(".")

        nodesList += `$Densky$.HTTPResponse.viewsTree.tree.set(
        "${nodeKey}", 
        new $Densky$.DynamicHtmlTreeNode("${node.filePath}", "${outPath}")
      );
      $Densky$.HTTPResponse.viewsTree.tree.get("${nodeKey}")!.sync(false);\n`;

        return node.write();
      }),
    );
  }

  await Promise.all(promises);

  const folderPath = pathMod.relative(Globals.cwd, options.viewsPath);
  const outDir = pathMod.relative(Globals.cwd, options.outDir);

  return `$Densky$.HTTPResponse.viewsTree = new $Densky$.DynamicHtmlTree("${folderPath}", "${outDir}");
  ${nodesList}`;
}
