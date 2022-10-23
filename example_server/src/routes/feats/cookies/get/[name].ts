import { HTTPRequest, IController } from "dusky";

export default class CookieController implements IController {
  GET(req: HTTPRequest) {
    return Response.json(req.cookies.get(req.params.get("name")!));
  }
}
