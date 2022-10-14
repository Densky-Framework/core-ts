import { HTTPRequest, IController } from "dusky";

export default class Controller implements IController {
  GET(req: HTTPRequest) {
    return new Response("FALLBACK: Matched " + req.pathname);
  }
}
