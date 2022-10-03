import { IController, HTTPError } from "dusky";
import { StatusCode } from "dusky/common.ts";

export default class HelloController implements IController {
  GET() {
    return new Response("Hola");
  }

  POST() {
    return new HTTPError(StatusCode.TEAPOT);
  }

  ANY() {
    return new Response("Hola (ANY)")
  }
}
