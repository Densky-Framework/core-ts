import { HTTPRequest, IController } from "dusky";

export default class ByeController implements IController {
  GET(_req: HTTPRequest) {
    return new Response("Bye " + _req.event.request.url);
  }
}
