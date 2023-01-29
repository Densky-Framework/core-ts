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
  let imports = "";
  let id_ = 0;
  const promises: Promise<void>[] = [];

  for (const nodeKey of tree.tree.keys()) {
    const node = tree.tree.get(nodeKey)!;
    const id = ++id_;
    promises.push(
      node.prepare().then(() => {
        // Remove last extension (.html.ts.ts)
        const _outPath = node.outPath.split(".");
        _outPath.pop();
        const filePath =
          `$Densky$.DynamicHtmlRuntime.resolve($Densky$.Globals.cwd, "${
            pathMod.relative(Globals.cwd, node.filePath)
          }")`;
        const outPath =
          `$Densky$.DynamicHtmlRuntime.resolve($Densky$.Globals.cwd, "${
            pathMod.relative(Globals.cwd, _outPath.join("."))
          }")`;

        imports += `import $views$${id} from "${
          pathMod.relative(options.outDir, node.outPath)
        }";\n`;
        nodesList += `$Densky$.HTTPResponse.viewsTree.tree.set(
        "${nodeKey}", 
        new $Densky$.DynamicHtmlTreeNode(${filePath}, ${outPath})
      );
      $Densky$.HTTPResponse.viewsTree.tree.get("${nodeKey}")!.render = $view$${id};\n`;

        return node.write();
      }),
    );
  }

  await Promise.all(promises);

  const folderPath = pathMod.relative(Globals.cwd, options.viewsPath);
  const outDir = pathMod.relative(Globals.cwd, options.outDir);

  return `${imports} $Densky$.HTTPResponse.viewsTree = new $Densky$.DynamicHtmlTree("${folderPath}", "${outDir}");
  ${nodesList}`;
}
