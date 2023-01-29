import { PrimitiveObject, StatusCode } from "../common.ts";
import { DynamicHtmlTree } from "../dynamic-html/DynamicHtmlTree.ts";

export class HTTPResponse {
  static viewsTree: DynamicHtmlTree;

  constructor(readonly event: Deno.RequestEvent) {}

  static async view(
    path: string,
    data?: unknown,
    init?: ResponseInit,
  ): Promise<Response> {
    if (!this.viewsTree) {
      throw new Error(
        "You're trying to use views without its config. Please set 'viewsPath' config.",
      );
    }

    const viewNode = await this.viewsTree.getNode(path);

    return viewNode.toResponse(data, init);
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
