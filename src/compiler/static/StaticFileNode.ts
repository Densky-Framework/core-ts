import { StaticFile, StaticFiles } from "../../utils/StaticFiles.ts";

export class StaticFileNode {
  staticFile: StaticFile | null = null;
  readonly filePath: string;

  constructor(
    readonly urlPath: string,
    readonly staticFiles: StaticFiles
  ) {
    this.filePath = staticFiles.normPath(urlPath);
  }

  async getStaticFile(): Promise<StaticFile> {
    if (!this.staticFile)
      this.staticFile = await this.staticFiles.getFile(this.urlPath);

    return this.staticFile;
  }
}
