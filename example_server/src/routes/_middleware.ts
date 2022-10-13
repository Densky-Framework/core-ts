import { IController, HTTPRequest, StatusCode } from "dusky";

export default class RootMiddleware implements IController {
  GET(req: HTTPRequest) {
    if (req.url.searchParams.has("block")) {
      return new Response("BLOCKED BY MIDDLEWARE", {
        status: StatusCode.LOCKED,
      });
    }
  }
}
