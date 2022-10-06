import { path, path as pathMod } from "../deps.ts";
import { RouteHandler } from "./RouteHandler.ts";
import { HTTPMethodStr } from "../common.ts";
import { chalk } from "../chalk.ts";

export class RouteFile {
  imports = new Set<[imports: string, path: string]>();
  handlers = new Map<HTTPMethodStr, RouteHandler>();

  constructor(readonly path: string, public outPath: string) {}

  relative(from: string) {
    return pathMod.relative(
      from.endsWith(".ts") ? pathMod.dirname(from) : from,
      this.outPath
    );
  }

  relativeOrg(from: string) {
    return pathMod.relative(
      from.endsWith(".ts") ? pathMod.dirname(from) : from,
      this.path
    );
  }

  resolveImport(path: string) {
    if (path.startsWith(".")) {
      const absPath = pathMod.join(pathMod.dirname(this.path), path);
      return pathMod.relative(this.outPath, absPath);
    } else return path;
  }

  protected resolveTopImport(line: string): [i: string, p: string] | null {
    const match = line.match(/^import (.+) from ["']([^'"]+)["'];?$/);
    if (!match) return null;

    const [_, imports, importPath] = match;

    return [imports, this.resolveImport(importPath)];
  }

  protected resolveDynamicImports(body: string) {
    const matches = body.matchAll(/import(["']([^'"]+)["'])/g);

    for (const [str, importPath] of matches) {
      body = body.replace(str, `import("${this.resolveImport(importPath)}")`);
    }

    return body;
  }

  addImport(line: string) {
    const resolved = this.resolveTopImport(line);
    if (resolved) this.imports.add(resolved);

    return this;
  }

  setHandler(method: HTTPMethodStr, body: RouteHandler) {
    body.body = this.resolveDynamicImports(body.body);

    this.handlers.set(method, body);

    return this;
  }

  setFileContent(content: string) {
    const imports = RouteFile.getImports(content);

    for (const im of imports) this.addImport(im);

    const handlers = RouteFile.getHandlers(content, this.path);

    for (const handler of handlers) this.setHandler(handler.method, handler);
  }

  /**
   * @throws Error - If the content doesn't have a correct class exporting
   */
  static getHandlers(content: string, filePath: string): RouteHandler[] {
    const relPath = path.relative(Deno.cwd(), filePath);
    if (content.length < 10) {
      throw new Error(
        chalk`{dim [${relPath}]} The file is empty or very short {dim (less than 10 characters)}`
      );
    }

    const handlers: RouteHandler[] = [];

    const classColIndex = content.search(
      /^export\s+default\s+class\s+(.+)\simplements\s+(.*)IController/gm
    );

    if (classColIndex === -1) {
      throw new Error(
        chalk`{dim [${relPath}]} The file isn't export correct class.
The class must be exported as default and will contains the implement of 'IController'`
      );
    }

    content = content.slice(classColIndex).trim();

    const methodRegex_ = "GET|POST|DELETE|PATH|ANY";
    const methodRegex = new RegExp(methodRegex_);
    // METHOD(REQPARAM: HTTPRequest): RETURN_TYPE {
    const handlerFnRegex = new RegExp(
      `(${methodRegex_})\\s*\\(\\s*(?:([a-zA-Z0-9_]+):\\s*HTTPRequest\\s*)?\\)(?:\\s*:\\s*[^{]+\\s*)? {`
    );

    const nextHandler = (remain: string) => {
      if (handlers.length >= 5) return;
      if (remain.length <= 0) return;

      const handlerIdx = remain.search(methodRegex);
      if (handlerIdx === -1) return;

      remain = remain.slice(handlerIdx);

      const match = remain.match(handlerFnRegex);
      if (match === null) return;

      const [str, method, reqParam] = match;
      remain = remain.slice(str.length).trim();

      let braceCount = 1;
      let tmpRemain = remain;
      let length = 0;

      while (braceCount > 0) {
        const nearCloseBracket = tmpRemain.search("}");
        const nearOpenBracket = tmpRemain.search("{");

        if (nearCloseBracket === -1 && nearOpenBracket === -1) {
          throw new Error("{dim [${relPath}]} Bad Code");
        }

        // If 'closeBracket' is more close then substract one to braceCount
        if (nearOpenBracket === -1 || nearOpenBracket > nearCloseBracket) {
          braceCount--;
          length += nearCloseBracket + 1;
          tmpRemain = tmpRemain.slice(nearCloseBracket + 1).trim();
          continue;
        }

        // else, add one to 'braceCount'
        braceCount++;
        length += nearOpenBracket + 1;
        tmpRemain = tmpRemain.slice(nearOpenBracket + 1).trim();
      }

      const end =
        (reqParam ? `let ${reqParam} = req;\n` : "") +
        remain.slice(0, length - 1).trim();

      handlers.push(
        new RouteHandler(method as HTTPMethodStr, end, reqParam ?? null)
      );

      nextHandler(remain.slice(length));
    };

    nextHandler(content);

    return handlers;
  }

  static getImports(text: string): string[] {
    return Array.from(text.matchAll(/import (.+) from ["']([^'"]+)["']/g)).map(
      (v) => v[0]
    );
  }
}
