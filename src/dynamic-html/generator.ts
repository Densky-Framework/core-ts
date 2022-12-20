import { pathMod } from "../deps.ts";
import { format } from "../compiler/formatter.ts";
import {
  DynamicHtml,
  DynamicHtmlImportPart,
  DynamicHtmlPart,
} from "./types.ts";

/*
  https://regex101.com/r/oP95kB/1

  Matches:
  func1, Func2 as f2, a from "./file.ts" as DEFAULT
  "./file.ts" as DEFAULT
  func1, Func2 as f2, a from "./file.ts"
  a from "./file.ts"
  b as c, a from "./file.ts"
  a as b from "./file.ts"
*/
const importRegex =
  /(?:((?:(?:,\s*)?[a-zA-Z_$][a-zA-Z0-9_$]*(?:\s+as\s+[a-zA-Z_$][a-zA-Z0-9_$]*)?)+) from\s+)?"([^"]+)"(?:\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*))?/;

const DATA = "data";

export function normalizeDynamicHtml(parts: DynamicHtmlPart[]): DynamicHtml {
  return parts.reduce<DynamicHtml>((dynamicHtml, part) => {
    if (part.type === "import") {
      const regex = importRegex.exec(part.content);
      if (!regex) throw new Error("Invalid import syntax: " + part.content);

      const [_, imports, filename, defaultName] = regex;
      const import_: DynamicHtmlImportPart = {
        type: "import",
        content: part.content,
        defaultName: defaultName?.trim() ?? null,
        filename: filename,
        imports: imports?.trim() ?? null,
      };

      dynamicHtml.imports.push(import_);
    } else dynamicHtml.parts.push(part);
    return dynamicHtml;
  }, { imports: [], parts: [] });
}

export function escape(data: string) {
  return data.replaceAll('"', "\\\"").replaceAll("\n", "\\n")
}

export function generateDynamicHtml(
  content: DynamicHtml,
  filename: string,
  output: string,
): string {
  const dirname = pathMod.dirname(filename);
  const outDir = pathMod.dirname(output);
  const imports = content.imports.map((import_) => {
    const imports = import_.imports ? `{ ${import_.imports} }` : null;
    const first = [import_.defaultName, imports].filter(Boolean);

    const resolvedImport = pathMod.relative(
      outDir,
      pathMod.resolve(dirname, import_.filename),
    );

    return `import ${
      first.length === 0 ? "" : first.join(", ") + " from "
    }"${resolvedImport}";`;
  }).join("\n");

  return format(
    output,
    `// deno-lint-ignore-file
  /** Densky/dynamic-html **/
  import { DenskyHtmlRuntime as __runtime__ } from "densky";
  ${imports}

  export default function(${DATA}: any, __output__: string = ""): string {
    ${
      content.parts.map((part) => {
        switch (part.type) {
          case "literal":
            return `__output__ += "${escape(part.content)}";`;

          case "eval":
            return `__output__ += __runtime__.escape(__runtime__.stringify((${part.content})));`;

          case "unescaped":
            return `__output__ += String((${part.content}));`;

          case "block":
            return part.content;
        }
        return "// INVALID TYPE";
      }).join("\n")
    }

    return __output__;
  }`,
  );
}
