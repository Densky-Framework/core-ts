import { StaticFile, StaticFiles } from "../../utils/StaticFiles.ts";

export class StaticFileNode {
  staticFile: StaticFile | null = null;

  constructor(
    readonly urlPath: string,
    readonly filePath: string,
    readonly staticFiles: StaticFiles,
  ) {}

  async getStaticFile(): Promise<StaticFile> {
    if (!this.staticFile) {
      this.staticFile = await this.staticFiles.getFile(this.filePath);
    }

    return this.staticFile;
  }
}
