import { debounce, fs, pathMod } from "../deps.ts";
import { Watcher, WatchEvent } from "../utils/Watcher.ts";
import { Globals } from "../globals.ts";
import { log } from "../log.ts";
import { generateDynamicHtml, normalizeDynamicHtml } from "./generator.ts";
import { parseDynamicHtml } from "./parser.ts";
import { DynamicHtml } from "./types.ts";

export class DynamicHtmlTree {
  tree: Map<string, DynamicHtmlTreeNode> = new Map();
  readonly watchType = "views" as const;

  constructor(readonly folderPath: string, readonly outDir: string) {
    this.folderPath = pathMod.resolve(Globals.cwd, folderPath);
  }

  resolvePath(filePath: string): string {
    return pathMod.resolve(this.folderPath, filePath);
  }

  async getNode(filePath: string): Promise<DynamicHtmlTreeNode> {
    filePath = this.resolvePath(filePath);
    const relPath = pathMod.relative(this.folderPath, filePath);

    if (this.tree.has(relPath)) {
      console.log("Using cache")
      return this.tree.get(relPath)!;
    }

    log(relPath, "VIEWS", "caching");

    const node = new DynamicHtmlTreeNode(
      filePath,
      this.getBuildFilePath(filePath),
    );
    await node.prepare();
    await node.sync(true);

    this.tree.set(relPath, node);

    // Setup watcher for this file
    if (Watcher.enabled) {
      const watcher = Watcher.watch(this.watchType + "/" + relPath);
      const reload = debounce(() => {
        // Reload build
        node.prepare()
          // Re-sync with build
          .then(() => node.sync(true))
          // Notify to dev
          .then(() => log(relPath, "modify", "VIEWS"));
      }, 100);

      const callback = (ev: WatchEvent) => {
        if (ev.kind === "modify") reload();
        else if (ev.kind === "remove") {
          this.tree.delete(relPath);
        }
      };

      watcher(callback);
    }

    return node;
  }

  getBuildFilePath(filePath: string): string {
    const relPath = pathMod.relative(this.folderPath, filePath);

    return pathMod.resolve(this.outDir, "views", relPath);
  }
}

export class DynamicHtmlTreeNode {
  render?: (data: unknown) => string;

  dynamicHtml?: DynamicHtml;

  constructor(
    readonly filePath: string,
    readonly outPath: string,
  ) {
    this.filePath = filePath;
    this.outPath = outPath + ".ts";
  }

  async prepare() {
    const html = await Deno.readTextFile(this.filePath);
    this.dynamicHtml = normalizeDynamicHtml(
      parseDynamicHtml(html),
    );
  }

  async write() {
    if (!this.dynamicHtml) {
      throw new Error(
        "DynamicHtmlNode is not prepared to build. Call .prepare() before this",
      );
    }

    const html = generateDynamicHtml(
      this.dynamicHtml,
      this.filePath,
      this.outPath,
    );

    await fs.ensureFile(this.outPath);
    await Deno.writeTextFile(
      this.outPath,
      html,
    );
  }

  async sync(write = false) {
    if (write) {
      await this.write();
    }

    try {
      // The '?k=...' is for prevent Deno import caching
      this.render = (await import(
        "file://" + this.outPath + "?k=" + ((Math.random() * 1e7) | 0)
      )).default;
    } catch (e) {
      console.error(e);
      throw new Error("Cannot sync with render build");
    }
  }

  toResponse(data: unknown, init: ResponseInit | Response = {}) {
    if (!this.render) {
      throw new Error("DynamicHtmlNode is not sync with the build, on " + this.filePath);
    }

    return new Response(this.render(data), {
      status: 200,
      ...init,
    });
  }
}
