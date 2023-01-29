import { CompileOptions } from "../compiler/types.ts";
import { pathMod } from "../deps.ts";
import { Globals } from "../globals.ts";
import { DynamicHtmlTree } from "./DynamicHtmlTree.ts";

export async function dynamicWrite(
  tree: DynamicHtmlTree,
  options: Required<CompileOptions>,
): Promise<string> {
  if (!options.viewsPath) return "";

  const nodesList: string[] = [];
  let imports = "";
  let id_ = 0;
  const promises: Promise<void>[] = [];

  for (const nodeKey of tree.tree.keys()) {
    const node = tree.tree.get(nodeKey)!;
    const id = ++id_;
    promises.push(
      node.prepare().then(() => {
        const filePath =
          `$Densky$.DenskyHtmlRuntime.resolve($Densky$.Globals.cwd, "${
            pathMod.relative(Globals.cwd, node.filePath)
          }")`;
        const outPath =
          `$Densky$.DenskyHtmlRuntime.resolve($Densky$.Globals.cwd, "${
            pathMod.relative(
              Globals.cwd,
              node.outPath.split(".").slice(0, -1).join("."),
            )
          }")`;

        imports += `import $view$${id} from "./${
          pathMod.relative(options.outDir, node.outPath)
        }";\n`;
        const nodeS = `new $Densky$.DynamicHtmlTreeNode(filePath, outPath)`;
        nodesList.push(
          "{",
          `const filePath = ${filePath}`,
          `const outPath = ${outPath}`,
          `const node = ${nodeS}`,
          `$Densky$.HTTPResponse.viewsTree.tree.set("${nodeKey}", node);`,
          `node.render = $view$${id};`,
          "}",
        );

        return node.write();
      }),
    );
  }

  await Promise.all(promises);

  const folderPath = pathMod.relative(Globals.cwd, options.viewsPath);
  const outDir = pathMod.relative(Globals.cwd, options.outDir);

  return imports +
    `\n$Densky$.HTTPResponse.viewsTree = new $Densky$.DynamicHtmlTree("${folderPath}", "${outDir}");\n` +
    nodesList.join("\n");
}
