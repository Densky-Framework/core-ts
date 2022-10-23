import { path as pathMod } from "../../deps.ts";

export abstract class RouteFile {
  topImport = new Set<[imports: string, path: string]>();
  dynamicimports = new Set<[str: string, path: string]>();

  constructor(readonly filePath: string, public outPath: string) {}

  relative(from: string) {
    return pathMod.relative(
      from.endsWith(".ts") ? pathMod.dirname(from) : from,
      this.outPath,
    );
  }

  relativeOrg(from: string) {
    return pathMod.relative(
      from.endsWith(".ts") ? pathMod.dirname(from) : from,
      this.filePath,
    );
  }

  resolveImport(path: string) {
    if (path.startsWith(".")) {
      const absPath = pathMod.join(pathMod.dirname(this.filePath), path);
      return pathMod.relative(pathMod.dirname(this.outPath), absPath);
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
    if (resolved) this.topImport.add(resolved);

    return this;
  }

  setFileContent(content: string) {
    const imports = RouteFile.getImports(content);

    for (const im of imports) this.addImport(im);

    this.handleContent(content);
  }

  protected abstract handleContent(content: string): Promise<void> | void;

  static getImports(text: string): string[] {
    return Array.from(text.matchAll(/import (.+) from ["']([^'"]+)["']/g)).map(
      (v) => v[0],
    );
  }
}
