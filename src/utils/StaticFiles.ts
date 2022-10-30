import { pathMod } from "../deps.ts";
import { getMimeType } from "./mime.ts";

export class StaticFiles {
  readonly cache = new Map();

  constructor(readonly folderPath: string) {}

  normPath(filePath: string): string {
    return pathMod.join(this.folderPath, filePath);
  }

  async getFile(filePath: string): Promise<StaticFile> {
    filePath = this.normPath(filePath);

    if (this.cache.has(filePath)) {
      const { ext } = pathMod.parse(filePath);
      // ext has a dot and we don't want it
      const extension = ext.slice(1);
      const mimetype = getMimeType(extension) || "text/plain";

      const file = await Deno.readFile(filePath);
      const staticFile = new StaticFile(file, mimetype);

      this.cache.set(filePath, staticFile);

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
