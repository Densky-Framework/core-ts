import { HTTPRequest, IController } from "dusky";

export default class Controller implements IController {
  GET(req: HTTPRequest) {
    return new Response(
      "PARAM: Matched (" + req.params.get("p1") + ") " + req.pathname,
    );
  }
}
