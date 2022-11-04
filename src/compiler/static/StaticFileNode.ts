import { pathMod } from "../../deps.ts";
import { StaticFile, StaticFiles } from "../../utils/StaticFiles.ts";

export class StaticFileNode {
  staticFile: StaticFile | null = null;

  constructor(
    readonly urlPath: string,
    readonly filePath: string,
    readonly staticFiles: StaticFiles,
  ) {
    this.filePath = pathMod.resolve(staticFiles.folderPath, filePath);
  }

  async getStaticFile(): Promise<StaticFile> {
    return await this.staticFiles.getFile(this.filePath);
  }
}
