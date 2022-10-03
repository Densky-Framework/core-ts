import { path, path as pathMod } from "../deps.ts";
import { RouteHandler } from "./RouteHandler.ts";
import { HTTPMethodStr } from "../common.ts";
import { chalk } from "../chalk.ts";

export class RouteFile {
  imports = new Set<string>();
  handlers = new Map<HTTPMethodStr, RouteHandler>();

  constructor(readonly path: string, readonly outPath: string) {}

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
    if (!pathMod.isAbsolute(path)) {
      const absPath = pathMod.join(pathMod.dirname(this.path), path);
      return pathMod.relative(this.outPath, absPath);
    } else return path;
  }

  protected resolveTopImport(line: string) {
    const match = line.match(/^import (.+) from ["']([^'"]+)["'];?$/);
    if (!match) return null;

    const [_, imports, importPath] = match;

    return `import ${imports} from "${this.resolveImport(importPath)}"`;
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
    if (content.length < 10) {
      throw new Error(
        chalk`{dim [${path.relative(
          Deno.cwd(),
          filePath
        )}]} The file is empty or very short {dim (less than 10 characters)}`
      );
    }

    const handlers: RouteHandler[] = [];

    const classColIndex = content.search(
      /^export\sdefault class\s(.+)\simplements\s(.*)IController/gm
    );

    if (classColIndex === -1) {
      throw new Error(
        chalk`{dim [${path.relative(
          Deno.cwd(),
          filePath
        )}]} The file isn't export correct class.
The class must be exported as default and will contains the implement of 'IController'`
      );
    }

    content = content.slice(classColIndex);

    const methodRegex = /GET|POST|DELETE|PATH|ANY/;

    const nextHandler = (remain: string) => {
      if (handlers.length >= 5) return;
      if (remain.length <= 0) return;

      const handlerIdx = remain.search(methodRegex);

      if (handlerIdx === -1) return;

      nextHandler(remain.slice(1));
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
