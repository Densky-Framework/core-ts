import { chalk, pathMod } from "../deps.ts";
import { getMimeType } from "./mime.ts";
import { Watcher, WatchEvent } from "./Watcher.ts";
import { Globals } from "../globals.ts";
import { timestamp } from "./timestamp.ts";

export class StaticFiles {
  readonly cache = new Map();

  constructor(
    readonly folderPath: string,
    readonly watchType: "static" | "views",
  ) {
    this.folderPath = pathMod.resolve(Globals.cwd, folderPath);
  }

  normPath(filePath: string): string {
    return pathMod.resolve(this.folderPath, filePath);
  }

  async getFile(filePath: string): Promise<StaticFile> {
    filePath = this.normPath(filePath);
    const relPath = pathMod.relative(this.folderPath, filePath);

    if (!this.cache.has(filePath)) {
      console.log(
        chalk`{dim  ${timestamp()}} {cyan {bold DENSKY} ${this.watchType.toUpperCase()} {green caching} }` +
          relPath,
      );
      const { ext } = pathMod.parse(filePath);
      // ext has a dot and we don't want it
      const extension = ext.slice(1);
      const mimetype = getMimeType(extension) || "text/plain";

      const file = await Deno.readFile(filePath);
      const staticFile = new StaticFile(file, mimetype);

      this.cache.set(filePath, staticFile);

      // Setup watcher for this file
      if (Watcher.enabled) {
        const watcher = Watcher.watch(this.watchType + "/" + relPath);
        const callback = (ev: WatchEvent) => {
          if (ev.kind !== "modify") return;

          watcher.unsubscribe(callback);
          this.cache.delete(filePath);

          console.log(
            chalk`{dim  ${timestamp()}} {cyan {bold DENSKY} ${this.watchType.toUpperCase()} {green ${ev.kind}} ${relPath}}`,
          );
        };

        watcher(callback);
      }

      return staticFile;
    } else {
      return this.cache.get(filePath)!;
    }
  }
}

export class StaticFile {
  constructor(readonly data: Uint8Array, readonly mimetype: string) {}

  decode(encoding = "utf-8") {
    const decoder = new TextDecoder(encoding);

    return decoder.decode(this.data);
  }

  toResponse(init: ResponseInit | Response = {}) {
    return new Response(this.data, {
      status: 200,
      ...init,
      headers: {
        "Content-Type": this.mimetype,
        ...(init.headers || {}),
      },
    });
  }
}
