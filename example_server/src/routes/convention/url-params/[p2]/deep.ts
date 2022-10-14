import { HTTPRequest, IController } from "dusky";

export default class Controller implements IController {
  GET(req: HTTPRequest) {
    return new Response("DEEP: Matched " + req.pathname);
  }
}
