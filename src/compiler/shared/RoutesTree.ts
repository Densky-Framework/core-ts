import { chalk } from "../../chalk.ts";
import { fs, path, pathPosix } from "../../deps.ts";
import { UrlMatcher, urlToMatcher } from "../../utils.ts";
import { format } from "../formatter.ts";
import { RouteFile } from "./RouteFile.ts";
import { RouteImport } from "./RouteImport.ts";
const pathMod = path;

export abstract class RoutesTree<
  FILE extends RouteFile = RouteFile,
> {
  /**
   * It's needed to circular type reference
   * This style is like rust with types inside
   * of traits (see @link https://doc.rust-lang.org/book/ch19-03-advanced-traits.html)
   * @internal
   */
  _TREE!: RoutesTree;

  #parent: typeof this["_TREE"] | null = null;
  children = new Set<(typeof this["_TREE"])>();
  fallback: (typeof this["_TREE"]) | null = null;
  middleware: (typeof this["_TREE"]) | null = null;

  readonly dirname: string;
  readonly relativePath: string;

  readonly matcher: UrlMatcher;

  middlewares: (typeof this["_TREE"])[] = [];
  readonly isMiddleware: boolean;

  constructor(
    readonly urlPath: string,
    readonly filePath: string,
    public routeFile: FILE | null,
    readonly isRoot: boolean = false,
  ) {
    this.dirname = pathMod.dirname(filePath);
    this.relativePath = pathMod.relative(Deno.cwd(), filePath);

    urlPath = urlPath.trim();

    // Normalize to have slash at the beginning
    if (!pathPosix.isAbsolute(urlPath)) {
      urlPath = "/" + urlPath;
    }

    this.urlPath = urlPath;
    this.isMiddleware = this.urlPath.endsWith("_middleware");
    this.matcher = urlToMatcher(this.urlPath);
  }

  get parent(): (typeof this["_TREE"]) | null {
    return this.#parent;
  }

  set parent(parent) {
    this.#parent = parent;

    this.calculateMiddlewares();
  }

  private calculateMiddlewares() {
    this.middlewares = [];

    const stack: (typeof this["_TREE"])[] = [];
    // Needs as current node
    // deno-lint-ignore no-this-alias
    let current: (typeof this["_TREE"]) | null = this;

    do {
      if (current.middleware) {
        stack.push(current.middleware);
      }
    } while ((current = current.parent));

    this.middlewares = stack.reverse();
  }

  abstract handleConvention(name: string, route: typeof this): boolean;

  addChild(route: typeof this) {
    if (route.urlPath.endsWith("_fallback")) {
      this.fallback = route;
    } else if (route.urlPath.endsWith("_middleware")) {
      this.middleware = route;
      this.calculateMiddlewares();
    } else {
      const match = route.urlPath.match(/_(.+)/);
      if (match && this.handleConvention(match[1], route)) return;

      this.children.add(route);
    }

    route.parent = this;

    return this;
  }

  generateImports(): string {
    if (this.routeFile) this.routeFile.outPath = this.filePath;

    const childrenImports = Array.from(this.children)
      .map((child, i) => {
        return `import $child$${i} from "./${
          path.relative(
            this.dirname,
            child.filePath,
          )
        }"`;
      })
      .join(";\n");

    // Omit if it's middleware
    const middlewareImports = this.isMiddleware ? "" : this.middlewares
      .map(
        (mid, i) =>
          `import $middle$${i} from "./${
            path.relative(
              this.dirname,
              mid.filePath,
            )
          }"`,
      )
      .join(";\n");

    return `import * as $Dusky$ from "dusky";
${childrenImports};
${middlewareImports}`;
  }

  getRouteIdentImports(): Map<string, RouteImport> {
    if (!this.routeFile) return new Map();

    const map = new Map<string, RouteImport>();

    this.routeFile.topImport.forEach(([im, path]) => {
      const def = RouteImport.getDefOf(im);

      const routeImport = map.get(path) ?? new RouteImport(path);

      // Add if has
      def.multiImports && routeImport.addMultiImports(def.multiImports);
      def.defaultImport && routeImport.addDefaultImport(def.defaultImport);
      def.starImport && routeImport.addStarImport(def.starImport);

      map.set(path, routeImport);
    });

    return map;
  }

  generateMiddlewares() {
    return !this.isMiddleware
      ? this.middlewares
        .map(
          (_, i) =>
            `const $mid$${i} = await $middle$${i}(req); if ($mid$${i}) return $mid$${i};`,
        )
        .join("\n")
      : "";
  }

  abstract generateBodyContent(): string;

  generateHandler() {
    const childCalls = Array.from(this.children)
      .map(
        (_, i) =>
          `const out$${i} = await $child$${i}(req); if (out$${i}) return out$${i}`,
      )
      .join(";\n");

    const bodyContent = this.generateBodyContent();

    const body = this.isMiddleware
      ? bodyContent
      : this.routeFile
      ? `if (${this.matcher.exactDecl("pathname")}) { ${bodyContent} }`
      : "";

    return childCalls + ";\n\n" + body;
  }

  buildFile(): string {
    const imports = this.generateImports();
    const routeImports = this.getRouteIdentImports();
    let body = this.generateMiddlewares() + this.generateHandler();

    const routeImportsStr: string[] = [];

    routeImports.forEach((routeImport) => {
      routeImport.filterUnused(body);

      const str = routeImport.toImportString();
      if (str.length > 0) routeImportsStr.push(str);
    });

    if (this.fallback) {
      body += this.fallback.generateBodyContent();

      this.fallback.getRouteIdentImports().forEach((routeImport) => {
        routeImport.filterUnused(body);

        const str = routeImport.toImportString();
        if (str.length > 0) routeImportsStr.push(str);
      });
    }

    const handler =
      this.isRoot || (this.children.size === 0 && this.fallback === null)
        ? body
        : this.isMiddleware
        ? body
        : `if (${this.matcher.startDecl("pathname")}) {${body}}`;

    const content = `// deno-lint-ignore-file
// ${this.relativePath}
// THIS FILE WAS GENERATED BY DUSKY-BACKEND (by Apika Luca)
${imports}
${routeImportsStr.join(";\n")}

${this.matcher.serialDecl("pathname")}

async function handler(req: $Dusky$.HTTPRequest): Promise<$Dusky$.HTTPPossibleResponse> {
  ${this.matcher.prepareDecl("pathname", "req")}
  ${handler}
}

export default handler;
`;

    // console.log(content);

    return format(this.filePath, content);
  }

  async writeFile() {
    await fs.ensureDir(pathMod.dirname(this.filePath));
    await Deno.writeTextFile(this.filePath, this.buildFile());
  }

  async writeFileIncremental() {
    await this.writeFile();
    await this.middleware?.writeFile();
    await Promise.all(
      Array.from(this.children).map((ch) =>
        ch.writeFileIncremental().catch((e) => {
          console.log(chalk.red("[Error] Error at", ch.relativePath));
          return e;
        })
      ),
    );
  }
}
