import { PrimitiveObject, StatusCode } from "../common.ts";
import { StaticFiles } from "../utils/StaticFiles.ts";

export class HTTPResponse {
  static viewsTree: StaticFiles;

  constructor(readonly event: Deno.RequestEvent) {}

  static async view(path: string, init?: ResponseInit): Promise<Response> {
    if (!this.viewsTree)
      throw new Error(
        "You're trying to use views without its config. Please set 'viewsPath' config."
      );

    const staticFile = await this.viewsTree.getFile(path);

    return staticFile.toResponse(init);
  }

  static fromJSON(obj: PrimitiveObject, init?: ResponseInit): Response {
    return new Response(JSON.stringify(obj), {
      status: StatusCode.OK,
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }
}
