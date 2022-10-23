import { HTTPRequest, IController } from "dusky";

export default class CookiesController implements IController {
  GET(req: HTTPRequest) {
    return Response.json(req.cookies.raw);
  }
}
