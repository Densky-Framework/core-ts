export interface RouteImportDef {
  multiImports: string[] | null;
  starImport: string | null;
  defaultImport: string | null;
}

export enum RouteImportType {
  Default,
  Star,
  Multi,
}

export class RouteImport {
  starImports = new Set<string>();
  defaultImports = new Set<string>();
  multiImports = new Set<string>();

  constructor(readonly path: string) {}

  clear() {
    this.starImports.clear();
    this.defaultImports.clear();
    this.multiImports.clear();
  }

  addStarImport(ident: string) {
    this.starImports.add(ident);
  }

  addDefaultImport(ident: string) {
    this.defaultImports.add(ident);
  }

  addMultiImports(multiImports: string[]) {
    multiImports.forEach((im) => this.multiImports.add(im));
  }

  addImport(ident: string, type: RouteImportType) {
    switch (type) {
      case RouteImportType.Default:
        this.defaultImports.add(ident);
        break;

      case RouteImportType.Star:
        this.starImports.add(ident);
        break;

      case RouteImportType.Multi:
        this.multiImports.add(ident);
        break;
    }

    return this;
  }

  getAllIdents(): Map<string, RouteImportType> {
    const idents = new Map<string, RouteImportType>();

    for (const im of this.starImports) {
      idents.set(im, RouteImportType.Star);
    }

    for (const im of this.defaultImports) {
      idents.set(im, RouteImportType.Default);
    }

    for (const im of this.multiImports) {
      idents.set(im, RouteImportType.Multi);
    }

    return idents;
  }

  toImportString() {
    const importStrings: string[] = [];
    const importPath = 'from "' + this.path + '"';

    this.starImports.forEach((im) => {
      importStrings.push(`import * as ${im} ${importPath}`);
    });

    const multiImportsStr = "{" + Array.from(this.multiImports).join(",") + "}";
    // If don't has multiImports, then set as already pushed
    let isMultiImportPushed = this.multiImports.size === 0 ? true : false;

    this.defaultImports.forEach((im) => {
      if (!isMultiImportPushed) {
        importStrings.push(`import ${im}, ${multiImportsStr} ${importPath}`);
        isMultiImportPushed = true;
      } else {
        importStrings.push(`import ${im} ${importPath}`);
      }
    });

    if (!isMultiImportPushed) {
      importStrings.push(`import ${multiImportsStr} ${importPath}`);
    }

    return importStrings.join(";\n");
  }

  filterUnused(body: string): this {
    const allIdents = this.getAllIdents();
    this.clear();

    // For every ident, if can find it inside of body, then put it
    // else, just ignore it
    allIdents.forEach((ty, ident) => {
      if (body.match(RouteImport.getMatcherOf(ident)) !== null) {
        this.addImport(ident, ty);
      }
    });

    return this;
  }

  static getMatcherOf(ident: string): RegExp {
    return new RegExp("(?:W)?" + ident + "(?:W)?", "g");
  }

  static getDefOf(im: string): RouteImportDef {
    im = im.trim();
    // Handle 'import { IMPORT1, ...IMPORTN } from "path"'
    const multiImportRange = [im.indexOf("{"), im.lastIndexOf("}")];
    const hasMultiImport = multiImportRange[0] !== -1;

    const multiImportSection = hasMultiImport
      ? im.slice(multiImportRange[0] + 1, multiImportRange[1])
      : "";
    const multiImports = multiImportSection
      .split(",")
      .map((im) => im.trim())
      // Prevent empty strings
      .filter((im) => im);

    // Remove multi imports section
    const remain = hasMultiImport
      ? im.slice(0, multiImportRange[0]).trim()
      : im;

    // Handle 'import * as IMPORT from "path"'
    const hasStarImport = remain.startsWith("* as ");
    const starImport = hasStarImport ? remain.slice(5).trim() : null;

    // Cannot has star and default import at same time
    const hasDefaultImport = !hasStarImport && remain.length > 0;
    // Handle 'import IMPORT from "path"'
    const defaultImport = hasDefaultImport
      ? remain
          // Remove end comma, eg. "dusky ,"
          .replace(/,$/, "")
      : "";

    return {
      multiImports: hasMultiImport ? multiImports : null,
      starImport,
      defaultImport: hasDefaultImport ? defaultImport : null,
    };
  }
}
