import { StaticFileNode } from "./StaticFileNode.ts";

export class StaticFileTree {
  readonly files = new Map<string, StaticFileNode>();

  constructor(readonly folderPath: string) {}

  /**
   * Handle a request in runtime.
   * For `DevServer`.
   */
  async handleRequest(urlPath: string): Promise<Response | null> {
    if (!this.files.has(urlPath)) return null;

    const file = this.files.get(urlPath)!;
    const staticFile = await file.getStaticFile();

    return staticFile.toResponse();
  }
}
