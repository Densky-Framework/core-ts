import { IController, HTTPError, HTTPRequest, HTTPResponse } from "dusky";
import { Promisable } from "dusky/common.ts";

export default class HelloController implements IController {
  GET(
    _req: HTTPRequest
  ): Promisable<HTTPResponse | Response | HTTPError | Error> {
    return new Response("Hola");
  }
}
